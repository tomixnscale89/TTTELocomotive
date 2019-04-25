// ============================================================================
// TTTELocmotive.gs
// Desc: Script designed to make Thomas models more simple for Trainz.
// Key features of this script are:
// Replaceable faces with the capabilities of a smokebox door.
// Eye directions are now handled separately, which makes eye direction easier for content creators.
// This script is provided as is and people are welcome to publish updates. The source will be available on github.
// ============================================================================
  
include "locomotive.gs" 
include	"meshobject.gs"
include "interface.gs"

// ============================================================================
// Style of code:
// Let's keep the initializations clearly indicated so we know where the fuck
// stuff is going. 
// Use lmssteam for reference until our code is strong enough to use on it's own.
// ============================================================================



// ============================================================================
// Name: tttelocomotive
// Desc: Script class for a generic TTTE Locomotive
// ============================================================================

class tttelocomotive isclass Locomotive
{
   // ****************************************************************************/
  // Define Functions
  // ****************************************************************************/
  int DetermineCarPosition(void);
  void SniffMyTrain(void);


  thread void EyeScriptCheckThread(void);
   void SetEyeMeshOrientation(float x, float y, float z);

   // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/
  StringTable strTable; // This asset's string table, saved for convenient fast access
  


  Asset headlight_asset;      // headlight asset used by the loco
  Asset rear_headlight_asset; // Backup headlight (not sure if we want this)
  Asset coupler_idle, coupler_coupled;											// two options for the coupler
  Asset driver, fireman;	// fireman and driver meshes 


  // ACS Stuff
  Library     ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams; // not sure what this is 


  //Eyescript Variables
   bool eye_UpPressed, eye_DownPressed, eye_LeftPressed, eye_RightPressed, eye_RollLeftPressed, eye_RollRightPressed;

   bool eye_IsControllerSupportEnabled; //Is a controller currently bound and set to control the script?
   bool eye_ControllerAbsolute = true; //This variable determines the mode of joystick support, true is absolute and false is relative. Absolute is when the axis values directly set the eye rotation, and relative mode instead adds a multiple of the axis value to the current position
		//These variables keep track of the rotation of the eyes, and will be dynamically updated incrementally. Rotations are defined relative to 0, with 0 being the absolute center of each axis.
	float eyeX = 0.0; //Left-Right Eye Rotation
	float eyeY = 0.0; // Eye Roll
	float eyeZ = 0.0; // Up-Down Eye Rotation
	float eye_Speed = 0.1; // Speed of eye movement, should be controlled through keyboard aswell
	float eye_UpdatePeriod = 0.04; //Time in seconds between each eye update, this should be increased if the eye seems too performance heavy, and decreased if the eye seems too jittery








  // Options for headcode lights;
  define int HEADCODE_NONE = 0;
  define int HEADCODE_ALL_LAMPS = 1;
  define int HEADCODE_TAIL_LIGHTS = 2;
  define int HEADCODE_BRANCH = 3;
  define int HEADCODE_EXPRESS = 4;
  define int HEADCODE_EXPRESS_FREIGHT = 5;
  define int HEADCODE_EXPRESS_FREIGHT_2 = 6;
  define int HEADCODE_EXPRESS_FREIGHT_3 = 7;
  define int HEADCODE_GOODS = 8;
  define int HEADCODE_LIGHT = 9;
  define int HEADCODE_THROUGH_FREIGHT = 10;
  define int HEADCODE_TVS = 11;

  int m_headCode;   // Stores the current state of the headcode lamps
  

  public define int CAR_DERAILED = -1;
  public define int CAR_CENTER   =  0;
  public define int CAR_FRONT    =  1;
  public define int CAR_BACK     =  2;
  public define int CAR_SINGLE   =  3; // CAR_FRONT + CAR_BACK == CAR_SINGLE. Yes, this is intentional.

  int m_carPosition; // position of car in train - one of the options above

  Train train;


  
  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init() // Let's keep the init at the top for ease of access 
  {
    // call the parent
    inherited();
	// Message Handlers
	
	//Eyescript
	AddHandler(me, "Eyescript", "Up", "HandleKeyUp");
	AddHandler(me, "Eyescript", "UpR", "HandleKeyUpRelease");
	AddHandler(me, "Eyescript", "Down", "HandleKeyDown");
	AddHandler(me, "Eyescript", "DownR", "HandleKeyDownRelease");
	AddHandler(me, "Eyescript", "Left", "HandleKeyLeft");
	AddHandler(me, "Eyescript", "LeftR", "HandleKeyLeftRelease");
	AddHandler(me, "Eyescript", "Right", "HandleKeyRight");
	AddHandler(me, "Eyescript", "RightR", "HandleKeyRightRelease");
	// Roll handling
	AddHandler(me, "Eyescript", "RLeft", "HandleKeyRLeft");
	AddHandler(me, "Eyescript", "RLeftR", "HandleKeyRLeftRelease");
	AddHandler(me, "Eyescript", "RRight", "HandleKeyRRight");
	AddHandler(me, "Eyescript", "RRightR", "HandleKeyRRightRelease");	

	//Init should be called for every engine regardless of whether it is selected? so iTrainz eyescript multiplayer should be possible






   // ****************************************************************************/
  // Define ACS Stuff
  // ****************************************************************************/
  ACSlib = World.GetLibrary(GetAsset().LookupKUIDTable("acslib"));
  ACSParams = new GSObject[1];
  ACSParams[0] = me;

  coupler_idle = GetAsset().FindAsset("coupler_idle");
  coupler_coupled = GetAsset().FindAsset("coupler_coupled");


  	m_carPosition = DetermineCarPosition();


   // message handlers for ACS entry points and tail lights
    AddHandler(me, "Vehicle", "Coupled", "VehicleCoupleHandler");
    AddHandler(me, "Vehicle", "Decoupled", "VehicleDecoupleHandler");
    AddHandler(me, "Vehicle", "Derailed", "VehicleDerailHandler");
    // lashed on as it happens to do the right thing
    AddHandler(me, "World", "ModuleInit", "VehicleDecoupleHandler");

    // ACS callback handler
    AddHandler(me, "ACScallback", "", "ACShandler");

    // headcode / reporting number handler

    // handler necessary for tail lights
    AddHandler(me, "Train", "Turnaround", "TrainTurnaroundHandler");


	train = me.GetMyTrain();

	SniffMyTrain();


  // Commented out for rn to keep the script basic
	//EyeScriptCheckThread(); // Initialize the eyescript thread, position could be changed if this causes errors
  }


  // ============================================================================
  // Name: ACSHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "ACS", "" messages
  // ============================================================================
  void ACShandler(Message msg)
  {
    // tokenise msg.minor into pipe ('|') separated strings
    string[] callback = Str.Tokens(msg.minor, "|");
	Interface.Print("I entered the ACS Handler");
    if (callback.size() >= 3)
    {
      if(callback[0] == "coupler")
      {
        if(callback[2] == "screwlink")
        {
		// couple is the name referenced inside the CONFIG of the Locomotive
          SetFXAttachment("couple_" + callback[1], coupler_coupled);
        }
        else
        {
		// couple is the name referenced inside the CONFIG of the Locomotive
          SetFXAttachment("couple_" + callback[1], coupler_idle);
        }
      }
    }
    else
    {
      TrainzScript.Log("ERROR: ACS Library returned invalid callback \"" + msg.minor + "\" - not divisible into at least 3 parts!");
    }
  }

    // ============================================================================
  // Name: VehicleCoupleHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Coupled" messages
  // ============================================================================
  void VehicleCoupleHandler(Message msg)
  {
  	Interface.Print("I entered the ACS Couple Handler");

    m_carPosition = DetermineCarPosition();

    // two vehicles that couple generate two couple events, one from each
    // so we can just act on ones that come from ourself
    if (msg.src == me)
    {
      ACSlib.LibraryCall("ACSrecalc", null, ACSParams);
    }
    
    SniffMyTrain();
  }


  // ============================================================================
  // Name: VehicleDecoupleHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Decoupled" messages
  // ============================================================================
  void VehicleDecoupleHandler(Message msg)
  {
    	Interface.Print("I entered the ACS Decouple Handler");

    m_carPosition = DetermineCarPosition();

    // only one decouple event is generated for each decouple,
    // not one for each half of train, so in this case have to check anyway
    // this is still reasonably efficient, as we can at least be confident
    // the decouple happened somewhere in our train

      ACSlib.LibraryCall("ACSrecalc", null, ACSParams);
    
    
    SniffMyTrain();
  }

    // ============================================================================
  // Name: VehicleDerailHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Vehicle", "Derailed" messages
  // ============================================================================
  void VehicleDerailHandler(Message msg)
  {
    if(msg.src == me)
    {
      m_carPosition = CAR_DERAILED;
      
      if(train)
      {
        Sniff(train, "Train", "", false);
      }
      
      ACSlib.LibraryCall("ACSrecalc", null, ACSParams);
    }
  }

  // ============================================================================
  // Name: TrainTurnaroundHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "Train", "Turnaround" messages
  // ============================================================================
  void TrainTurnaroundHandler(Message msg)
  {
    m_carPosition = DetermineCarPosition();

    // ConfigureLights();
  }

  
    // ============================================================================
  // Name: DetermineCarPosition()
  // Desc: Determine our position in this consist
  // ============================================================================
  int DetermineCarPosition()
  {
      	Interface.Print("I entered Determine Car position");

    Train consist;
    Vehicle[] cars;
    int rval = CAR_CENTER;

    consist = GetMyTrain();
    cars = consist.GetVehicles();
    if (me == cars[0])
    {
      rval = rval + CAR_FRONT;
    }
    if (me == cars[cars.size() - 1])
    {
      rval = rval + CAR_BACK;
    }
    return rval;
  }

  // ============================================================================
  // Name: SniffMyTrain()
  // Desc: Maintain 'sniff' access on the current train for 'Train' messages
  // ============================================================================
  void SniffMyTrain()
  {
    Train oldTrain = train;
	    	Interface.Print("I entered Sniff");

    train = GetMyTrain();

    if(oldTrain)
    {
      if(oldTrain != train)
      {
        Sniff(oldTrain, "Train", "", false);
        //Sniff(oldTrain, "SetTrainReportingNumber", "", false);
        Sniff(train, "Train", "", true);
        //Sniff(train, "SetTrainReportingNumber", "", true);
      }
    }
    else
    {
      Sniff(train, "Train", "", true);
      //Sniff(train, "SetTrainReportingNumber", "", true);
    }
  }

	public void HandleKeyUp(Message msg)
	{
    	 eye_UpPressed = true;
	}
	public void HandleKeyUpRelease(Message msg)
	{
    	 eye_UpPressed = false;
	}
	public void HandleKeyDown(Message msg)
	{
    	 eye_DownPressed = true;
	}
	public void HandleKeyDownRelease(Message msg)
	{
    	 eye_DownPressed = false;
	}
	public void HandleKeyLeft(Message msg)
	{
    	 eye_LeftPressed = true;
	}
	public void HandleKeyLeftRelease(Message msg)
	{
    	 eye_LeftPressed = false;
	}
	public void HandleKeyRight(Message msg)
	{
    	 eye_RightPressed = true;
	}
	public void HandleKeyRightRelease(Message msg)
	{
    	 eye_RightPressed = false;
	}

	public void HandleKeyRLeft(Message msg)
	{
    	 eye_RollLeftPressed = true;
	}
	public void HandleKeyRLeftRelease(Message msg)
	{
    	 eye_RollLeftPressed = false;
	}
	public void HandleKeyRRight(Message msg)
	{
    	 eye_RollRightPressed = true;
	}
	public void HandleKeyRRightRelease(Message msg)
	{
    	 eye_RollRightPressed = false;
	}


	void SetEyeMeshOrientation(float x, float y, float z)
	{
    	SetMeshOrientation("eye_l", x, y, z);
		SetMeshOrientation("eye_r", x, y, z);
	}






	thread void EyeScriptCheckThread() {
		while(true)
		{
		//all of this should eventually be in an if statement to check whether you are focused to this loco and have control over it, with an else statement that should listen for messages through multiplayer connections

		//This thread should be run whenever the engine is initialized?, and will constantly update eyescript position variables and set orientations relevant to the eyescript implementation

			if (!eye_IsControllerSupportEnabled){
				//Controller is not currently set to be used, eye rotation should be incremented relative to the current value
				if(eye_UpPressed)
				{
					eyeZ = eyeZ + eye_Speed;
				}
				if(eye_DownPressed)
				{
					eyeZ = eyeZ - eye_Speed;
				}
				if(eye_RollLeftPressed)
				{
					eyeY = eyeY - eye_Speed;
				}
				if(eye_RollRightPressed)
				{
					eyeY = eyeY + eye_Speed;
				}
				if(eye_LeftPressed)
				{
					eyeX = eyeX - eye_Speed;
				}
				if(eye_RightPressed)
				{
					eyeX = eyeX + eye_Speed;
				}
			} else {
				// This is run when the Controller is set to be used - Absolute mode and relative mode

				//CURRENTLY UNIMPLEMENTED
				if(eye_ControllerAbsolute)
				{
				//Absolute mode is enabled

				} else {
				//Relative mode is enabled
				
				
				}	
			}

	 


			//And Finally, once all of the eye logic has been run, the script needs to actually apply the variable changes to the eye orientations themselves
			SetEyeMeshOrientation(eyeX, eyeY, eyeZ);
			Sleep(eye_UpdatePeriod);
		}
	}



};