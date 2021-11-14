
include "vehicle.gs"
include "meshobject.gs"
include "tttelib.gs"
include "tttebase.gs"
include "couple.gs" //procedural coupler <kuid:414976:104101> Procedural Coupler

// ============================================================================
// Name: tttewagon
// Desc: Script class for a generic TTTE Wagon
// ============================================================================
class tttewagon isclass Vehicle, TTTEBase
{
  tttelib TTTEWagonLibrary;

  int DetermineCarPosition();
  void SniffMyTrain();

  // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/

  Soup LiveryContainer;
  Soup LiveryTextureOptions;
  Soup BogeyLiveryTextureOptions;

  // Bogie array to use for livery swapping
  Bogey[] myBogies;

  bool m_cameraTarget; // Is this the camera target?

  Library ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams;

  IKCoupler FrontCoupler;
  IKCoupler BackCoupler;
  Vehicle LastCoupleInteraction;

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
  public void Init(Asset asset) // Let's keep the init at the top for ease of access
  {
    // call the parent
    inherited(asset);
    self = me;
    BaseInit(asset);


    myBogies = me.GetBogeyList();

    LiveryContainer = ExtensionsContainer.GetNamedSoup("liveries");
    LiveryTextureOptions = ExtensionsContainer.GetNamedSoup("livery-textures");
    BogeyLiveryTextureOptions = ExtensionsContainer.GetNamedSoup("bogey-livery-textures");

    AddHandler(Interface, "Camera", "Target-Changed", "CameraTargetChangedHandler");

    // message handlers for ACS entry points and tail lights
    AddHandler(me, "Vehicle", "Coupled", "VehicleCoupleHandler");
    AddHandler(me, "Vehicle", "Decoupled", "VehicleDecoupleHandler");
    AddHandler(me, "Vehicle", "Derailed", "VehicleDerailHandler");
    // lashed on as it happens to do the right thing
    AddHandler(me, "World", "ModuleInit", "VehicleDecoupleHandler");

    // handler necessary for tail lights
    AddHandler(me, "Train", "Turnaround", "TrainTurnaroundHandler");

    // ****************************************************************************/
    // Define ACS Stuff
    // ****************************************************************************/
    // ACS callback handler
    AddHandler(me, "ACScallback", "", "ACShandler");
    ACSlib = World.GetLibrary(GetAsset().LookupKUIDTable("acslib"));
    ACSParams = new GSObject[1];
    ACSParams[0] = me;

    //Procedural Coupler System
    FrontCoupler = cast<IKCoupler>(GetFXAttachment("couple_front"));
    BackCoupler = cast<IKCoupler>(GetFXAttachment("couple_back"));
    //important
    if(FrontCoupler)
      FrontCoupler.PostInit(me, "front");
    if(BackCoupler)
      BackCoupler.PostInit(me, "back");

    Soup KUIDTable = myConfig.GetNamedSoup("kuid-table");
    m_carPosition = DetermineCarPosition();

  }

  // ============================================================================
  // Name: CameraTargetChangedHandler(Message msg)
  // Parm:  Message msg
  // Desc:
  // ============================================================================
  void CameraTargetChangedHandler(Message msg)
  {
    m_cameraTarget = (msg.src == me);
  }

  // ============================================================================
  // Name: GetRelativeDirectionString(Vehicle targetvehicle, string location)
  // Desc:
  // ============================================================================
  string GetRelativeDirectionString(Vehicle targetvehicle, string location)
  {
    //front and same - back
    //front and different - front
    //back and same - front
    //back and different - back
    bool SameDirection = (GetDirectionRelativeToTrain() == targetvehicle.GetDirectionRelativeToTrain());
    if(location == "front")
    {
      if(SameDirection) return "back";
      else return "front";
    }
    else if (location == "back")
    {
      if(SameDirection) return "front";
      else return "back";
    }
    return "front";
  }

  // ============================================================================
  // Name: PlayCoupleAnimation(string direction)
  // Desc:
  // ============================================================================
  void PlayCoupleAnimation(string direction)
  {
    //cache the most recent coupled vehicle in case another couple operation occurs
    Vehicle TargetVehicle = LastCoupleInteraction;
    if(TargetVehicle)
    {
      string OppositeDirection = GetRelativeDirectionString(TargetVehicle, direction);
      IKCoupler OppositeCoupler = cast<IKCoupler>(TargetVehicle.GetFXAttachment("couple_" + OppositeDirection));

      if(direction == "front")
      {
        FrontCoupler.CoupleTo(OppositeCoupler);
      }
      else if(direction == "back")
      {
        BackCoupler.CoupleTo(OppositeCoupler);
      }
    }
  }

  // ============================================================================
  // Name: PlayDecoupleAnimation(string direction)
  // Desc:
  // ============================================================================

  void PlayDecoupleAnimation(string direction)
  {
    //cache the most recent coupled vehicle in case another couple operation occurs
    Vehicle TargetVehicle = LastCoupleInteraction;
    if(TargetVehicle)
    {
      string OppositeDirection = GetRelativeDirectionString(TargetVehicle, direction);
      IKCoupler OppositeCoupler = cast<IKCoupler>(TargetVehicle.GetFXAttachment("couple_" + OppositeDirection));

      if(direction == "front")
      {
        FrontCoupler.DecoupleFrom(OppositeCoupler);
      }
      else if(direction == "back")
      {
        BackCoupler.DecoupleFrom(OppositeCoupler);
      }
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
          PlayCoupleAnimation(callback[1]);
          //SetFXAttachment("couple_" + callback[1], coupler_coupled);
        }
        else
        {
		      // couple is the name referenced inside the CONFIG of the Locomotive
          PlayDecoupleAnimation(callback[1]);
          //SetFXAttachment("couple_" + callback[1], coupler_idle);
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

    if (msg.src != me) LastCoupleInteraction = cast<Vehicle>msg.src;
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

    if (msg.src != me) LastCoupleInteraction = cast<Vehicle>msg.src;
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
};
