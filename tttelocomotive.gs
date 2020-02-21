// ============================================================================
// TTTELocmotive.gs
// Desc: Script designed to make Thomas models more simple for Trainz.
// Key features of this script are:
// Replaceable faces with the capabilities of a smokebox door.
// Eye script from Rileyzzz
// ============================================================================
// Should work in all Trainz versions.
// This script is provided as is and people are welcome to publish updates. The source will be available on github.
// ============================================================================
// Authors:
// GDennish (Tomix)
// Rileyzzz
// ============================================================================

include "locomotive.gs"
include	"meshobject.gs"
include "interface.gs"
include "orientation.gs"
include "multiplayergame.gs"
include "soup.gs"
// ============================================================================
// Style of code:
// Use lmssteam for reference until our code is strong enough to use on it's own.
// ============================================================================

// ============================================================================
// TO DO:
// 1. Update all eyescript code to reflect the latest version on github.
// 2. Begin implementing a GUI for the Lamps, and make the interface overall a bit more pretty.
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
  void ConfigureHeadcodeLamps(int headcode);
  string HeadcodeDescription(int headcode);
  public void SetProperties(Soup soup);
  public Soup GetProperties(void);
  public string GetDescriptionHTML(void);
  string GetPropertyType(string p_propertyID);
  string GetPropertyName(string p_propertyID);
  string GetPropertyDescription(string p_propertyID);
  public string[] GetPropertyElementList(string p_propertyID);
  void SetPropertyValue(string p_propertyID, string p_value, int p_index);


  thread void EyeScriptCheckThread(void);
   void SetEyeMeshOrientation(float x, float y, float z);
   void eye_ConstructSoup();
   void eye_DeconstructSoup(Message msg);

   // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/
  StringTable strTable; // This asset's string table, saved for convenient fast access



  Asset headlight_asset;      // headlight asset used by the loco
  Asset rear_headlight_asset; // Backup headlight (not sure if we want this)
  Asset coupler_idle, coupler_coupled;											// two options for the coupler
  Asset driver, fireman;	// fireman and driver meshes


  // Bogie array to use for livery swapping
  Bogey[] myBogies; // Array of bogies from Conifg


  bool m_cameraViewpoint; // Current Camera point
  bool m_cameraTarget; // Is this the camera target?

  bool m_trainzModule;

  float trainzVersion = World.GetTrainzVersion();

  // LIVERY SWAPPING Variables
  Asset textureSet; // Texture asset we will use to grab the textures
  define int LIVERY_0 = 0;
  define int LIVERY_1 = 1;
  define int LIVERY_2 = 2;
  define int LIVERY_3 = 3; // temporary livery Options. This will change from asset to asset...

  int skinSelection; // Integer used to store the current skin of the asset. This will default to zero, unless forced in Init().
  int copySkin; // May not be needed..

  // Faces Options
  int faceSelection;
  //int newFace = -1; Not used until a cleaner approach for swapping faces is available.
  define int FACE_0 = 0;
  define int FACE_1 = 1;
  define int FACE_2 = 2;
  define int FACE_3 = 3;
  define int FACE_4 = 4;
  define int FACE_5 = 5;
  define int SMOKEBOXDOOR = 6;
  // we are referencing this as "face_6" inside the config stringtable since the
  //code will only look for something labeled as "face_". Probably should fix.

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
  int eye_animframe = 0;

// eyescript animation variables
  Orientation[] eye_anim; //eye animation data
  bool eye_isrecording = false;
  bool eye_isanimating = false;

  bool eye_enableexperimentalnetworking = false; // enable experimental iTrainz networking, for multiplayer games




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
    // ****************************************************************************/
   // Grab assets from the Locomotive
   // ****************************************************************************/
  strTable = GetAsset().GetStringTable(); // String table to be used for obtaining information inside the Config
  myBogies = me.GetBogeyList(); // Grab all of the bogies on the locomotive, specifically for swapping texture purposes.

  faceSelection = 0; // Since we are assuming the locomotive has a face, let's set it to zero so the default face will appear.



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


  //AddHandler(null, "tttelocomotive", "eye", "eye_DeconstructSoup"); //Soup deconstructor for multiplayer, null may not be the best thing to use
	//Init should be called for every engine regardless of whether it is selected? so iTrainz eyescript multiplayer should be possible


  // ****************************************************************************/
 // Define Camera Handlers for hiding/showing the low poly exterior cab on steam locos.
 // ****************************************************************************/
  AddHandler(Interface, "Camera", "Internal-View", "CameraInternalViewHandler");
  AddHandler(Interface, "Camera", "External-View", "CameraInternalViewHandler");
  AddHandler(Interface, "Camera", "Tracking-View", "CameraInternalViewHandler");
  AddHandler(Interface, "Camera", "Roaming-View", "CameraInternalViewHandler");
  AddHandler(Interface, "Camera", "Target-Changed", "CameraTargetChangedHandler");



   // ****************************************************************************/
  // Define ACS Stuff
  // ****************************************************************************/
  ACSlib = World.GetLibrary(GetAsset().LookupKUIDTable("acslib"));
  ACSParams = new GSObject[1];
  ACSParams[0] = me;

  // Idle coupler mesh must have a default-mesh tag in the effects container or else it will not show.
  coupler_idle = GetAsset().FindAsset("coupler_idle");
  coupler_coupled = GetAsset().FindAsset("coupler_coupled");

  headlight_asset = GetAsset().FindAsset("lamp");
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


	train = me.GetMyTrain(); // Get the train
	SniffMyTrain(); // Then sniff it


  // Commented out for rn to keep the script basic
	//EyeScriptCheckThread(); // Initialize the eyescript thread, position could be changed if this causes errors
  }

  // ============================================================================
  // Name: SetCabmesh()
  // Parm:  None
  // Desc: Sets the Cabin mesh and driver/fireman meshes to be visible if we are in the correct camera state.
  // ============================================================================
  void SetCabmesh()
  {
    if (m_cameraViewpoint and m_cameraTarget) // Inside the locomotive
    {
      me.SetMeshVisible("cabin", false, 0.0);
      me.SetMeshVisible("driver", false, 0.0);
    }
    else // Outside the cabin
    {
      me.SetMeshVisible("cabin", true, 0.0);
      me.SetMeshVisible("driver", true, 0.0);
    }
  }


  void CameraInternalViewHandler(Message msg)
  {
    m_cameraViewpoint = (msg.minor == "Internal-View");

    SetCabmesh();
  }

  void CameraTargetChangedHandler(Message msg)
  {
    m_cameraTarget = (msg.src == me);

    SetCabmesh();
  }



  void ConfigureSkins()
  {
    //TrainzScript.Log("Entered ConfigureSkins");
    switch(skinSelection)
    {
      //TrainzScript.Log("Entered switch of ConfigureSkins, "+ m_skinSelection);

      case LIVERY_0:

      break;

      case LIVERY_1:

      break;

      case LIVERY_2:

      break;

      case LIVERY_3:

      break;

      default:
      //SetFXTextureReplacement("stack_albedo",textureset,m_copySkin);

      //myBogies[0].SetFXTextureReplacement("drive_albedo",textureset,m_copySkinBogey);

      break;

    }
  }

  // Want to properly implement this, but it doesn't work properly if the user selects a face and then changes their mind.
  void SetFacesVisible(int faceType, bool visible, float fadeTime)
  {
    switch(faceType)
    {
      case FACE_0:
      SetMeshVisible("face0",visible,fadeTime);
      break;

      case FACE_1:
      SetMeshVisible("face1",visible,fadeTime);
      break;

      case FACE_2:
      SetMeshVisible("face2",visible,fadeTime);
      break;

      case FACE_3:
      SetMeshVisible("face3",visible,fadeTime);
      break;

      case FACE_4:
      SetMeshVisible("face4",visible,fadeTime);
      break;

      case FACE_5:
      SetMeshVisible("face5",visible,fadeTime);
      break;

      case SMOKEBOXDOOR:
      SetMeshVisible("smokebox",visible,fadeTime);
      break;

      default:
      break;
    }
  }


  // ============================================================================
  // Name: ConfigureFaces()
  // Parm:  None
  // Desc: Configures the locomotive face. Uses a switch with faceSelection to determmine the correct face to display.
  // ============================================================================
  void ConfigureFaces()
  {

    // This code is for the proper implementation of this method, I'm not sure how to implement it right now.
    //if(newFace != faceSelection)
    //{
      //SetFacesVisible(faceSelection,false,0.0);
      //newFace = faceSelection;
      //SetFacesVisible(newFace,true,0.0);
    //}

    switch(faceSelection) // Switch based on the values from the top of this script
    {
      case FACE_0:
      SetMeshVisible("face0",true,0.0);
      SetMeshVisible("face1",false,0.0);
      SetMeshVisible("face2",false,0.0);
      SetMeshVisible("face3",false,0.0);
      SetMeshVisible("face4",false,0.0);
      SetMeshVisible("face5",false,0.0);
      SetMeshVisible("eye_r",true,0.0);
      SetMeshVisible("eye_l",true,0.0);
      SetMeshVisible("smokebox",false,0.0);
      break;

      case FACE_1:
      SetMeshVisible("face0",false,0.0);
      SetMeshVisible("face1",true,0.0);
      SetMeshVisible("face2",false,0.0);
      SetMeshVisible("face3",false,0.0);
      SetMeshVisible("face4",false,0.0);
      SetMeshVisible("face5",false,0.0);
      SetMeshVisible("eye_r",true,0.0);
      SetMeshVisible("eye_l",true,0.0);
      SetMeshVisible("smokebox",false,0.0);
      break;

      case FACE_2:
      SetMeshVisible("face0",false,0.0);
      SetMeshVisible("face1",false,0.0);
      SetMeshVisible("face2",true,0.0);
      SetMeshVisible("face3",false,0.0);
      SetMeshVisible("face4",false,0.0);
      SetMeshVisible("face5",false,0.0);
      SetMeshVisible("eye_r",true,0.0);
      SetMeshVisible("eye_l",true,0.0);
      SetMeshVisible("smokebox",false,0.0);
      break;

      case FACE_3:
      SetMeshVisible("face0",false,0.0);
      SetMeshVisible("face1",false,0.0);
      SetMeshVisible("face2",false,0.0);
      SetMeshVisible("face3",true,0.0);
      SetMeshVisible("face4",false,0.0);
      SetMeshVisible("face5",false,0.0);
      SetMeshVisible("eye_r",true,0.0);
      SetMeshVisible("eye_l",true,0.0);
      SetMeshVisible("smokebox",false,0.0);
      break;

      case FACE_4:
      SetMeshVisible("face0",false,0.0);
      SetMeshVisible("face1",false,0.0);
      SetMeshVisible("face2",false,0.0);
      SetMeshVisible("face3",false,0.0);
      SetMeshVisible("face4",true,0.0);
      SetMeshVisible("face5",false,0.0);
      SetMeshVisible("eye_r",true,0.0);
      SetMeshVisible("eye_l",true,0.0);
      SetMeshVisible("smokebox",false,0.0);
      break;

      case FACE_5:
      SetMeshVisible("face0",false,0.0);
      SetMeshVisible("face1",false,0.0);
      SetMeshVisible("face2",false,0.0);
      SetMeshVisible("face3",false,0.0);
      SetMeshVisible("face4",false,0.0);
      SetMeshVisible("face5",true,0.0);
      SetMeshVisible("eye_r",true,0.0);
      SetMeshVisible("eye_l",true,0.0);
      SetMeshVisible("smokebox",false,0.0);
      break;

      case SMOKEBOXDOOR: // Should not only hide the faces, but also the eyes since this is a smokebox door.
      SetMeshVisible("face0",false,0.0);
      SetMeshVisible("face1",false,0.0);
      SetMeshVisible("face2",false,0.0);
      SetMeshVisible("face3",false,0.0);
      SetMeshVisible("face4",false,0.0);
      SetMeshVisible("face5",false,0.0);
      SetMeshVisible("eye_r",false,0.0);
      SetMeshVisible("eye_l",false,0.0);
      SetMeshVisible("smokebox",true,0.0);
      break;

      default:
      SetMeshVisible("face0",true,0.0);
      SetMeshVisible("face1",false,0.0);
      SetMeshVisible("face2",false,0.0);
      SetMeshVisible("face3",false,0.0);
      SetMeshVisible("face4",false,0.0);
      SetMeshVisible("face5",false,0.0);
      SetMeshVisible("eye_r",true,0.0);
      SetMeshVisible("eye_l",true,0.0);
      SetMeshVisible("smokebox",false,0.0);
      break;
    }

  }


  // ============================================================================
  // Name: ACSHandler()
  // Parm: msg - Message to handle
  // Desc: Message handler for "ACS", "" messages
  // ============================================================================
  void ACShandler(Message msg)
  {
    // The ACS Handler is run when a coupling change is detected, either coupled or uncoupled
    // tokenwise msg.minor into pipe ('|') separated strings
    string[] callback = Str.Tokens(msg.minor, "|");
	  // Interface.Print("I entered the ACS Handler");
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
  	//Interface.Print("I entered the ACS Couple Handler");

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
    //Interface.Print("I entered the ACS Decouple Handler");

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
  }


    // ============================================================================
  // Name: DetermineCarPosition()
  // Desc: Determine our position in this consist
  // ============================================================================
  int DetermineCarPosition()
  {
    //Interface.Print("I entered Determine Car position");

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
	  //Interface.Print("I entered Sniff");

    train = GetMyTrain();

    if(oldTrain)
    {
      if(oldTrain != train)
      {
        Sniff(oldTrain, "Train", "", false);
        Sniff(train, "Train", "", true);
      }
    }
    else
    {
      Sniff(train, "Train", "", true);
    }
  }

  // ============================================================================
  // Name: ConfigureHeadcodeLamps()
  // Desc: Sets the lamp arrangement from the headcode variable
  // Lamp names are fairly self-explanatory, but here is the full name for each lamp:
  // lamp_tc  = Top Center , lamp_bc = Bottom Center , Lamp_bl = Bottom Left , lamp_br = Bottom Right
  // ============================================================================
  void ConfigureHeadcodeLamps(int headcode)
  {
    // We are going to use SetFXAttachment to set the lamps in the correct positions.
    // This is using the names of the lamps that are in the effects container of the locomotive.
    switch (headcode)
    {
      case HEADCODE_TVS:
        SetFXAttachment("lamp_tc", null);
        SetFXAttachment("lamp_bc" , null);
        SetFXAttachment("lamp_bl", null);
        SetFXAttachment("lamp_br", headlight_asset);
        break;

    case HEADCODE_NONE:
    SetFXAttachment("lamp_tc", null);
    SetFXAttachment("lamp_bc" , null);
    SetFXAttachment("lamp_bl", null);
    SetFXAttachment("lamp_br", null);
    break;

    case HEADCODE_LIGHT:
    SetFXAttachment("lamp_tc", headlight_asset);
    SetFXAttachment("lamp_bc" , null);
    SetFXAttachment("lamp_bl", null);
    SetFXAttachment("lamp_br", null);
    break;

    case HEADCODE_EXPRESS:
    SetFXAttachment("lamp_tc", null);
    SetFXAttachment("lamp_bc" , null);
    SetFXAttachment("lamp_bl", headlight_asset);
    SetFXAttachment("lamp_br", headlight_asset);
    break;

    case HEADCODE_ALL_LAMPS:
    SetFXAttachment("lamp_tc", headlight_asset);
    SetFXAttachment("lamp_bc" , headlight_asset);
    SetFXAttachment("lamp_bl", headlight_asset);
    SetFXAttachment("lamp_br", headlight_asset);
    break;

    case HEADCODE_TAIL_LIGHTS:
    SetFXAttachment("lamp_tc", null);
    SetFXAttachment("lamp_bc" , null);
    SetFXAttachment("lamp_bl", headlight_asset);
    SetFXAttachment("lamp_br", headlight_asset);
    break;

    case HEADCODE_BRANCH:
    SetFXAttachment("lamp_tc", null);
    SetFXAttachment("lamp_bc" , null);
    SetFXAttachment("lamp_bl", headlight_asset);
    SetFXAttachment("lamp_br", null);
    break;

    case HEADCODE_EXPRESS_FREIGHT:
    SetFXAttachment("lamp_tc", headlight_asset);
    SetFXAttachment("lamp_bc" , null);
    SetFXAttachment("lamp_bl", null);
    SetFXAttachment("lamp_br", headlight_asset);
    break;

    case HEADCODE_EXPRESS_FREIGHT_2:
    SetFXAttachment("lamp_tc", null);
    SetFXAttachment("lamp_bc" , headlight_asset);
    SetFXAttachment("lamp_bl", headlight_asset);
    SetFXAttachment("lamp_br", null);
    break;

    case HEADCODE_EXPRESS_FREIGHT_3:
    SetFXAttachment("lamp_tc", headlight_asset);
    SetFXAttachment("lamp_bc" , null);
    SetFXAttachment("lamp_bl", headlight_asset);
    SetFXAttachment("lamp_br", null);
    break;

    case HEADCODE_GOODS:
    SetFXAttachment("lamp_tc", null);
    SetFXAttachment("lamp_bc" , headlight_asset);
    SetFXAttachment("lamp_bl", null);
    SetFXAttachment("lamp_br", headlight_asset);
    break;

    case HEADCODE_THROUGH_FREIGHT:
    SetFXAttachment("lamp_tc", headlight_asset);
    SetFXAttachment("lamp_bc" , headlight_asset);
    SetFXAttachment("lamp_bl", null);
    SetFXAttachment("lamp_br", null);
    break;

    default:
    Interface.Print("Something did not work");
    break;
    }

  }
  // ============================================================================
  // Name: HeadcodeDescription()
  // Desc: Returns the description (aka name) of the headcode selected.
  // We use this instead of placing it inside the traincar config to save extra
  // Data the user has to put in their own creations. Plus, this will never change
  // so there is no reason for the user to specify what headcodes to use.
  // ============================================================================

  string HeadcodeDescription(int headcode)
  {
    string temp = "xxx"; // Create a temporary scratch string to use
    switch(headcode) // Let the headcode integer be passed through the function, and the switch will return the description.
    {
      case HEADCODE_TVS:
      temp = "TVS Lamp Headcode";
      break;
      default:
      Interface.Print("Something did not work");
      break;

    }
    return temp;
  }


    // ============================================================================
    // Name: SetProperties()
    // Parm: soup - properties soup to set internal state from
    // Desc: SetProperties is called by Trainz to load script state
    // ============================================================================
    public void SetProperties(Soup soup)
    {
      inherited(soup);

      faceSelection = soup.GetNamedTagAsInt("faces", faceSelection);
      ConfigureFaces();

      skinSelection = soup.GetNamedTagAsInt("skin", skinSelection);
      ConfigureSkins();
      // load headcode
      m_headCode = soup.GetNamedTagAsInt("headcode-lamps", m_headCode);
    }


    // ============================================================================
    // Name: GetProperties()
    // Retn: Soup - properties soup containing the current internal state
    // Desc: GetProperties is called by Trainz to save script state
    // ============================================================================
    public Soup GetProperties(void)
    {
      Soup soup = inherited();

      // Save the headcode as a soup tag so we can access it in other locations.
      soup.SetNamedTag("headcode-lamps", m_headCode);

      soup.SetNamedTag("faces", faceSelection);

      soup.SetNamedTag("skin",skinSelection);

      return soup;
    }


    // ============================================================================
    // Name: GetDescriptionHTML()
    // Retn: string - HTML for a description pane
    // Desc: GetDescriptionHTML is
    // ============================================================================
    public string GetDescriptionHTML(void)
    {
  //    TrainzScript.Log("GetDescriptionHTML Called!");

      string html = inherited();

      // option to change headcode, this displays inside the ? HTML window in surveyor.
      //string headcodeLampStr = "<a href=live://property/headcode_lamps>" + HeadcodeDescription(m_headCode) + "</a>";
      //html = html + "<p>" + headcodeLampStr + "</p>";

      string classFaceStr = "<a href=live://property/faces>" + strTable.GetString("face_" + faceSelection) + "</a>";
      html = html + "<p>" + strTable.GetString1("faces_desc", classFaceStr) + "</p>";

      string classSkinStr = "<a href=live://property/skin>" + strTable.GetString("skin_" + skinSelection) + "</a>";
      html = html + "<p>" + strTable.GetString1("skin_desc", classSkinStr) + "</p>";

      // Let's post the current Trainz version for debugging purposes.
      string trainzVerStr = "The Trainz Build number is: " + trainzVersion;

  //    TrainzScript.Log("HTML Is: " + html);

      return html + trainzVerStr;
    }

  // ============================================================================
  // Name: GetPropertyType()
  // Parm: p_propertyID - name of property
  // Retn: string - type of property
  // Desc: GetPropertyType is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  string GetPropertyType(string p_propertyID)
  {
    if (p_propertyID == "headcode_lamps")
    {
      return "list";
    }
    else if (p_propertyID == "faces")
    {
      return "list";
    }
    else if (p_propertyID == "skin")
    {
      return "list";
    }

    return inherited(p_propertyID);
  }


  // ============================================================================
  // Name: GetPropertyName()
  // Parm: p_propertyID - name of property
  // Retn: string - user friendly display name of property
  // Desc: GetPropertyName is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  string GetPropertyName(string p_propertyID)
  {
    if (p_propertyID == "headcode_lamps")
    {
      Interface.Print(" I entered GetPropertyName looking for something");
      return "hello";
    }
    if (p_propertyID == "faces")
    {
      return strTable.GetString("faces_name");
    }
    if (p_propertyID == "skin")
    {
      return strTable.GetString("skin_name");
    }

    return inherited(p_propertyID);
  }



  // ============================================================================
  // Name: GetPropertyDescription()
  // Parm: p_propertyID - name of property
  // Retn: string - user friendly description of property
  // Desc: GetPropertyDescription is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  string GetPropertyDescription(string p_propertyID)
  {
    if (p_propertyID == "headcode_lamps")
    {
      Interface.Print(" I entered GetPropertyDescription looking for something");
      return "Please select a lamp headcode you would like to use:";
    }
    else if(p_propertyID == "faces")
    {
      return strTable.GetString("faces_description");
    }
    else if(p_propertyID == "skin")
    {
      return strTable.GetString("skin_description");
    }

    return inherited(p_propertyID);
  }


  // ============================================================================
  // Name: GetPropertyElementList()
  // Parm: p_propertyID - name of property
  // Retn: string[] - array of string descriptions for each value
  // Desc: GetPropertyElementList is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  public string[] GetPropertyElementList(string p_propertyID)
  {
    int i;
    string [] result = new string[0];

    if (p_propertyID == "headcode_lamps")
    {
      for (i = 0; i < 12; i++) // Let us loop through the entire possible headcodes and list them all.
      {
        result[i] = HeadcodeDescription(i);
      }
    }
    else if (p_propertyID == "faces")
    {
      for(i = 0; i < 7; i++) // Let us loop through the entire possible faces and list them all.
      {
        result[i] = strTable.GetString("face_" +i);
      }
    }
    else if (p_propertyID == "skin")
    {
      for(i = 0; i < 2; i++) // Let us loop through the entire possible skins and list them all.
      {
        result[i] = strTable.GetString("skin_" +i);
      }
    }
    else
    {
      result = inherited(p_propertyID);
    }

    return result;
  }


  // ============================================================================
  // Name: SetPropertyValue()
  // Parm: p_propertyID - name of property
  // Parm: p_value - string name of property value chosen
  // Parm: p_index - integer index of property value chosen
  // Desc: SetPropertyValue is a utility function used by the properties display
  //       system, allowing the user to edit properties of the vehicle via the
  //       description window.
  // ============================================================================
  void SetPropertyValue(string p_propertyID, string p_value, int p_index)
  {
    if (p_propertyID == "headcode_lamps")
    {
      if (p_index > -1 and p_index < 12)
      {
        ConfigureHeadcodeLamps(p_index);
      }
    }
    else if (p_propertyID == "faces")
    {
      if (p_index > -1 and p_index < 7)
      {
        faceSelection = p_index;
        ConfigureFaces();
      }
    }
    else if (p_propertyID == "skin")
    {
      if (p_index > -1 and p_index < 2)
      {
        skinSelection = p_index;
        ConfigureSkins();
      }
    }
    else
    {
      inherited(p_propertyID, p_value, p_index);
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
    //Network to other players here
    if(eye_enableexperimentalnetworking){
      //UNIMPLEMENTED
      eye_ConstructSoup();
    }
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
					eyeX = eyeX - eye_Speed;
				}
				if(eye_DownPressed)
				{
					eyeX = eyeX + eye_Speed;
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
					eyeZ = eyeZ - eye_Speed;
				}
				if(eye_RightPressed)
				{
					eyeZ = eyeZ + eye_Speed;
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

      //add to animation array logic
      //warning - this runs at the same speed as the eyescript, and can be performance heavy due to this
      if(eye_isanimating and (eye_animframe <= (eye_anim.size()-1))){ // check if the eye should be currently animating and the animation isnt over
        Orientation eye_Angdeconstruct = eye_anim[eye_animframe];
        eyeX = eye_Angdeconstruct.rx;
        eyeY = eye_Angdeconstruct.ry;
        eyeZ = eye_Angdeconstruct.rz;

        eye_animframe = eye_animframe + 1;
      }else{

        eye_animframe = 0;
        eye_isanimating = false;
      }

      if(eye_isrecording){

        Orientation eye_Angbuilder;

        eye_Angbuilder.rx = eyeX;
        eye_Angbuilder.ry = eyeY;
        eye_Angbuilder.rz = eyeZ;
        eye_anim[eye_anim.size()] = eye_Angbuilder; //Append animation frame to array

      }

			//And Finally, once all of the eye logic has been run, the script needs to actually apply the variable changes to the eye orientations themselves ================================================

			SetEyeMeshOrientation(eyeX, eyeY, eyeZ);

			Sleep(eye_UpdatePeriod);
		}
	}

  void eye_ConstructSoup()
	{
    if(eye_enableexperimentalnetworking){
      Soup datasoup;


      //BroadcastGameplayMessage(string msgMajor, string msgMinor, Soup data);
      //BroadcastGameplayMessage("tttelocomotive", "eye", datasoup); Currently this broadcasts to everyone on the server, it should eventually be changed to only broadcast to other clients that have their cameras near the locomotive (however it may not even be parsed if the draw distance doesnt cause script execution on invisible locos)

    }
	}
  void eye_DeconstructSoup(Message msg)
	{
    if(eye_enableexperimentalnetworking){

    }
	}
};
