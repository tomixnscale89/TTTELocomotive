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
  void SetNamedFloatFromExisting(Soup in, Soup out, string tagName);

  thread void EyeScriptCheckThread(void);
  void SetEyeMeshOrientation(float x, float y, float z);
  thread void MultiplayerBroadcast(void);
  void createMenuWindow();
  thread void BrowserThread();
  thread void ScanBrowser(void);
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

  Soup myConfig;
  Soup ExtensionsContainer;
  Soup FacesContainer;
  Soup LiveryContainer;
  Soup SmokeboxContainer;

  Soup SmokeEdits;
  // ACS Stuff
  Library     ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams; // not sure what this is


  //Eyescript Variables


  define bool eye_IsControllerSupportEnabled = true; //Is a controller currently bound and set to control the script?

	//These variables keep track of the rotation of the eyes, and will be dynamically updated incrementally. Rotations are defined relative to 0, with 0 being the absolute center of each axis.
	float eyeX = 0.0; //Left-Right Eye Rotation
	float eyeY = 0.0; // Eye Roll
	float eyeZ = 0.0; // Up-Down Eye Rotation

	define float eye_UpdatePeriod = 0.01;
  define float MP_UpdatePeriod = 0.1;
  int eye_animframe = 0;

// eyescript animation variables
  Orientation[] eye_anim; //eye animation data
  bool eye_isrecording = false;
  bool eye_isanimating = false;

  //unimplemented keyboard control vars
  define bool eye_ControllerAbsolute = true; //unimplemented
  define float eye_Speed = 0.1;
  bool eye_UpPressed, eye_DownPressed, eye_LeftPressed, eye_RightPressed, eye_RollLeftPressed, eye_RollRightPressed;

  //Browser interface
  Browser browser;
  define int BROWSER_MAINMENU = 0;
  define int BROWSER_EYEMENU = 1;
  define int BROWSER_LOCOMENU = 2;
  define int BROWSER_SMOKEMENU = 3;

  int CurrentMenu = BROWSER_MAINMENU;
  bool HasFocus = false;
  bool BrowserClosed;

  //tab specific Options
  bool b_WheelslipEnabled = false;
  float normal_maxtractiveeffort;
  float normal_traction;
  float normal_momentum;


  //bitwise flags
  define int HEADCODE_BL = 1;
  define int HEADCODE_BC = 2;
  define int HEADCODE_BR = 4;
  define int HEADCODE_TC = 8;

  define int HEADCODE_NONE = 0;
  define int HEADCODE_ALL_LAMPS = HEADCODE_BL | HEADCODE_BC | HEADCODE_BR | HEADCODE_TC;
  define int HEADCODE_TAIL_LIGHTS = HEADCODE_BL | HEADCODE_BR;
  define int HEADCODE_BRANCH = HEADCODE_BL;
  define int HEADCODE_EXPRESS = HEADCODE_BL | HEADCODE_BR;
  define int HEADCODE_EXPRESS_FREIGHT = HEADCODE_TC | HEADCODE_BR;
  define int HEADCODE_EXPRESS_FREIGHT_2 = HEADCODE_BC | HEADCODE_BL;
  define int HEADCODE_EXPRESS_FREIGHT_3 = HEADCODE_TC | HEADCODE_BL;
  define int HEADCODE_GOODS = HEADCODE_BC | HEADCODE_BR;
  define int HEADCODE_LIGHT = HEADCODE_TC;
  define int HEADCODE_THROUGH_FREIGHT = HEADCODE_TC | HEADCODE_BC;
  define int HEADCODE_TVS = HEADCODE_BR;

  // Options for headcode lights;
  //define int HEADCODE_NONE = 0;
  //define int HEADCODE_ALL_LAMPS = 1;
  //define int HEADCODE_TAIL_LIGHTS = 2;
  //define int HEADCODE_BRANCH = 3;
  //define int HEADCODE_EXPRESS = 4;
  //define int HEADCODE_EXPRESS_FREIGHT = 5;
  //define int HEADCODE_EXPRESS_FREIGHT_2 = 6;
  //define int HEADCODE_EXPRESS_FREIGHT_3 = 7;
  //define int HEADCODE_GOODS = 8;
  //define int HEADCODE_LIGHT = 9;
  //define int HEADCODE_THROUGH_FREIGHT = 10;
  //define int HEADCODE_TVS = 11;

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

  myConfig = me.GetAsset().GetConfigSoup();
  ExtensionsContainer = me.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
  FacesContainer = ExtensionsContainer.GetNamedSoup("faces");
  LiveryContainer = ExtensionsContainer.GetNamedSoup("liveries");
  SmokeboxContainer = ExtensionsContainer.GetNamedSoup("smokeboxes");

  SmokeEdits = Constructors.NewSoup();
  int ParticleCount = 0;
  int curTag;
  for(curTag = 0; curTag < myConfig.CountTags(); curTag++)
  {
    string tagName = myConfig.GetIndexedTagName(curTag);
    if(TrainUtil.HasPrefix(tagName, "smoke"))
    {
      Soup curSmoke = myConfig.GetNamedSoup(tagName);

      Soup NewContainer = Constructors.NewSoup();
      NewContainer.SetNamedTag("active", false); //whether to override
      NewContainer.SetNamedTag("expanded", false);
      SetNamedFloatFromExisting(curSmoke, NewContainer, "rate");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "velocity");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "lifetime");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "minsize");
      SetNamedFloatFromExisting(curSmoke, NewContainer, "maxsize");

      TrainzScript.Log(NewContainer.AsString());
      SmokeEdits.SetNamedSoup((string)ParticleCount, NewContainer);
      ParticleCount = ParticleCount + 1;
    }
  }

  TrainzScript.Log((string)ParticleCount + " particles found.");

  //typical extensions container example
  //faces
  //{
  //  happy "Happy"
  //  sad "Sad"
  //  smokebox1 "Red Smokebox"
  //  smokebox2 "Green Smokebox"
  //}
  //smokeboxes
  //{
  //  smokebox1 "static"
  //  smokebox2 "animated"
  //}
  //liveries
  //{
  //  red "Red"
  //  green "Green"
  //}


	//Eyescript
  AddHandler(me, "ControlSet", "eye-xaxis", "HandleXAxis");
  AddHandler(me, "ControlSet", "eye-yaxis", "HandleYAxis");

  AddHandler(me, "ControlSet", "eye-faceleft", "HandleKeyFLeft");
  AddHandler(me, "ControlSet", "eye-faceright", "HandleKeyFRight");
  AddHandler(me, "ControlSet", "eye-wheesh", "HandleWheesh");
  AddHandler(me, "ControlSet", "eye-wheesh-up", "HandleWheeshUp");


  //Multiplayer Message! Important!
  AddHandler(me, "TTTELocomotiveMP", "update", "MPUpdate");

  EyeScriptCheckThread();
  if(MultiplayerGame.IsActive()){
    MultiplayerBroadcast();
  }

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

  //create the browser menu - this could be changed later to link to a pantograph or keybind
  createMenuWindow();
  ScanBrowser();
  BrowserThread();
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



  }

  // ============================================================================
  // Name: SetNamedFloatFromExisting()
  // Desc: Utility for copying soups.
  // ============================================================================
  void SetNamedFloatFromExisting(Soup in, Soup out, string tagName)
  {
    if(in.GetIndexForNamedTag(tagName) != -1) out.SetNamedTag(tagName, Str.UnpackFloat(in.GetNamedTag(tagName)));
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


  // ============================================================================
  // Name: ConfigureFaces()
  // Parm:  None
  // Desc: Configures the locomotive face. Uses a switch with faceSelection to determmine the correct face to display.
  // ============================================================================
  void ConfigureFaces()
  {
    TrainzScript.Log("Setting face to " + (string)faceSelection);
    //clear our faces
    int i;
    for(i = 0; i < FacesContainer.CountTags(); i++)
    {
        SetMeshVisible(FacesContainer.GetIndexedTagName(i), false, 0.0);
    }

    //set our active face to be visible
    SetMeshVisible(FacesContainer.GetIndexedTagName(faceSelection), true, 0.0);

    string activeFaceMesh = FacesContainer.GetIndexedTagName(faceSelection);

    //determine if this is a smokebox mesh
    if(SmokeboxContainer.GetIndexForNamedTag(activeFaceMesh) == -1)
    {
      SetMeshVisible("eye_l", true, 0.0);
      SetMeshVisible("eye_r", true, 0.0);
    }
    else
    {
      SetMeshVisible("eye_l", false, 0.0);
      SetMeshVisible("eye_r", false, 0.0);
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
    if ((headcode & HEADCODE_BL) != 0) SetFXAttachment("lamp_bl", headlight_asset);
    else SetFXAttachment("lamp_bl", null);
    if ((headcode & HEADCODE_BC) != 0) SetFXAttachment("lamp_bc", headlight_asset);
    else SetFXAttachment("lamp_bc", null);
    if ((headcode & HEADCODE_BR) != 0) SetFXAttachment("lamp_br", headlight_asset);
    else SetFXAttachment("lamp_br", null);
    if ((headcode & HEADCODE_TC) != 0) SetFXAttachment("lamp_tc", headlight_asset);
    else SetFXAttachment("lamp_tc", null);

  }

  // ============================================================================
  // Name: HeadcodeDescription()
  // Desc: Returns the description (aka name) of the headcode selected.
  // We use this instead of placing it inside the traincar config to save extra
  // Data the user has to put in their own creations. Plus, this will never change
  // so there is no reason for the user to specify what headcodes to use.
  // ============================================================================
  bool FlagTest(int flags, int mask)
  {
    return flags == mask;
  }

  string HeadcodeDescription(int headcode)
  {
    string temp = "xxx"; // Create a temporary scratch string to use

    //temporary, move to string table later
    if (FlagTest(headcode, HEADCODE_NONE)) temp = "None";
    if (FlagTest(headcode, HEADCODE_ALL_LAMPS)) temp = "All Lamps";
    if (FlagTest(headcode, HEADCODE_TAIL_LIGHTS)) temp = "Tail Lights";
    if (FlagTest(headcode, HEADCODE_BRANCH)) temp = "Branch Headcode";
    if (FlagTest(headcode, HEADCODE_EXPRESS)) temp = "Express Headcode";
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT)) temp = "Express Freight 1";
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT_2)) temp = "Express Freight 2";
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT_3)) temp = "Express Freight 3";
    if (FlagTest(headcode, HEADCODE_GOODS)) temp = "Goods";
    if (FlagTest(headcode, HEADCODE_LIGHT)) temp = "Light";
    if (FlagTest(headcode, HEADCODE_THROUGH_FREIGHT)) temp = "Through Freight";
    if (FlagTest(headcode, HEADCODE_TVS)) temp = "TVS Lamp Headcode";
    return temp;
  }

  // ============================================================================
  // Name: GetHeadcodeFlags()
  // Desc: Converts a headcode number to a series of flags.
  // ============================================================================

  int GetHeadcodeFlags(int headcode_number)
  {
    int returnFlags = 0;
    switch(headcode_number)
    {
      case 0:
        returnFlags = HEADCODE_NONE;
        break;
      case 1:
        returnFlags = HEADCODE_ALL_LAMPS;
        break;
      case 2:
        returnFlags = HEADCODE_TAIL_LIGHTS;
        break;
      case 3:
        returnFlags = HEADCODE_BRANCH;
        break;
      case 4:
        returnFlags = HEADCODE_EXPRESS;
        break;
      case 5:
        returnFlags = HEADCODE_EXPRESS_FREIGHT;
        break;
      case 6:
        returnFlags = HEADCODE_EXPRESS_FREIGHT_2;
        break;
      case 7:
        returnFlags = HEADCODE_EXPRESS_FREIGHT_3;
        break;
      case 8:
        returnFlags = HEADCODE_GOODS;
        break;
      case 9:
        returnFlags = HEADCODE_LIGHT;
        break;
      case 10:
        returnFlags = HEADCODE_THROUGH_FREIGHT;
        break;
      case 11:
        returnFlags = HEADCODE_TVS;
        break;
      default:
        returnFlags = HEADCODE_NONE;
    }
    return returnFlags;
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
      string headcodeLampStr = "<a href=live://property/headcode_lamps>" + HeadcodeDescription(m_headCode) + "</a>";
      html = html + "<p>" + headcodeLampStr + "</p>";

      string classFaceStr = "<a href=live://property/faces>" + FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(faceSelection)) + "</a>";
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
        result[i] = HeadcodeDescription(GetHeadcodeFlags(i));
      }
    }
    else if (p_propertyID == "faces")
    {
      for(i = 0; i < FacesContainer.CountTags(); i++) // Let us loop through the entire possible faces and list them all.
      {
        result[i] = FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(i));
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
        m_headCode = GetHeadcodeFlags(p_index);
        ConfigureHeadcodeLamps(m_headCode);
      }
    }
    else if (p_propertyID == "faces")
    {
      if (p_index > -1 and p_index < FacesContainer.CountTags())
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

  // ============================================================================
  // Name: SetEyeMeshOrientation()
  // Desc: Sets the locomotive eye rotation.
  // ============================================================================

  void SetEyeMeshOrientation(float x, float y, float z)
	{
    SetMeshOrientation("eye_l", x, y, z);
		SetMeshOrientation("eye_r", x, y, z);
	}

  // ============================================================================
  // Name: ControlSet Handlers
  // ============================================================================

  public void HandleXAxis(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    //if(Source and cast<Locomotive>Source.GetParentObject() == me)
    //{
      Soup parameters = msg.paramSoup;
      eyeX = (parameters.GetNamedTagAsFloat("control-value") - 0.5) * 1.2;
      SetEyeMeshOrientation(eyeY, eyeZ, eyeX);
    //}
  }

  public void HandleYAxis(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    //if(Source and cast<Locomotive>Source.GetParentObject() == me)
    //{
    Soup parameters = msg.paramSoup;
    eyeY = -(parameters.GetNamedTagAsFloat("control-value") - 0.5) * 1.2;
    SetEyeMeshOrientation(eyeY, eyeZ, eyeX);
    //}
  }

  //Face handling
  public void HandleKeyFLeft(Message msg)
  {
    if (faceSelection > 0)
    {
      faceSelection = faceSelection - 1;
    }
    ConfigureFaces();
  }

  public void HandleKeyFRight(Message msg)
  {
    if (faceSelection < FacesContainer.CountTags() - 1)
    {
      faceSelection = faceSelection + 1;
    }
    ConfigureFaces();
  }

  //wheeshing, currently disabled
  public void HandleWheesh(Message msg)
  {
    //PostMessage(me, "pfx", "+4",0.0);
    //Wheeshing = true;
  }

  public void HandleWheeshUp(Message msg)
  {
    //PostMessage(me, "pfx", "-4",0.0);
    //Wheeshing = false;
  }
  // ============================================================================
  // Name: EyeScriptCheckThread()
  // Desc: A thread that manages eye movement.
  // ============================================================================

	thread void EyeScriptCheckThread() {
		while(true) {
      //Animation setup
      if(eye_isanimating and (eye_animframe <= (eye_anim.size()-1))){ // check if the eye should be currently animating and the animation isnt over
        Orientation eye_Angdeconstruct = eye_anim[eye_animframe];
        eyeX = eye_Angdeconstruct.rx;
        eyeY = eye_Angdeconstruct.ry;
        eyeZ = eye_Angdeconstruct.rz;

        eye_animframe = eye_animframe + 1;

      } else {
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

      //Get rotation from Menu
      if (CurrentMenu == BROWSER_EYEMENU and !BrowserClosed and browser)
      {
        eyeX = Str.ToFloat(browser.GetElementProperty("eyeX", "value")) * Math.PI / 180;
        eyeY = Str.ToFloat(browser.GetElementProperty("eyeY", "value")) * Math.PI / 180;
        eyeZ = Str.ToFloat(browser.GetElementProperty("eyeZ", "value")) * Math.PI / 180;
      }

			//final orientation apply ================================================
			SetEyeMeshOrientation(eyeY, eyeZ, eyeX);

			Sleep(eye_UpdatePeriod);
		}
	}


  // ============================================================================
  // Name: MultiplayerBroadcast()
  // Desc: Thread that networks all locomotive information to other MP clients.
  // ============================================================================

  //This section of the code handles the multiplayer, using some epic advanced soup business
	thread void MultiplayerBroadcast() {
		while(true)
    {
			//CHECK FOR CLIENT OWNERSHIP, OTHERWISE IT WILL GET MESSY
			DriverCharacter driver = me.GetMyTrain().GetActiveDriver();
			if (MultiplayerGame.IsActive() and driver and driver.IsLocalPlayerOwner()) {

				//this thread will package up data and send it across the server to be listened for
				Soup senddata = Constructors.NewSoup();
        senddata.SetNamedTag("eyeX",eyeX);
        senddata.SetNamedTag("eyeY",eyeY);
        senddata.SetNamedTag("eyeZ",eyeZ);
				senddata.SetNamedTag("face", faceSelection);
        senddata.SetNamedTag("skin",skinSelection);
        senddata.SetNamedTag("headcode",m_headCode);
				//senddata.SetNamedTag("wheesh",Wheeshing);
				senddata.SetNamedTag("id",me.GetGameObjectID());
				MultiplayerGame.BroadcastGameplayMessage("TTTELocomotiveMP", "update", senddata);
			}
			Sleep(MP_UpdatePeriod); // don't go too crazy with data
		}
	}

  // ============================================================================
  // Name: MPUpdate()
  // Desc: Client side MP information handler.
  // ============================================================================

	//receives and handles multiplayer messages
	public void MPUpdate(Message msg)
	{
		Soup ReceivedData = msg.paramSoup;

		DriverCharacter driver = me.GetMyTrain().GetActiveDriver();
		if(driver.IsLocalPlayerOwner() == false and me.GetGameObjectID().DoesMatch(ReceivedData.GetNamedTagAsGameObjectID("id"))) //this might not work idk
		{
			//Interface.Print("Data Confirmed!");
      float ReyeX = ReceivedData.GetNamedTagAsFloat("eyeX");
    	float ReyeY = ReceivedData.GetNamedTagAsFloat("eyeY");
      float ReyeZ = ReceivedData.GetNamedTagAsFloat("eyeZ");

			int RfaceSelection = ReceivedData.GetNamedTagAsInt("face");
      int Rskinselection = ReceivedData.GetNamedTagAsInt("skin");
      int Rheadcode = ReceivedData.GetNamedTagAsInt("headcode");
			eyeX = ReyeX;
			eyeY = ReyeY;
      eyeZ = ReyeZ;

			if(faceSelection != RfaceSelection)
			{
				faceSelection = RfaceSelection;
        ConfigureFaces();
			}

      if(skinSelection != Rskinselection)
      {
        skinSelection = Rskinselection;
        ConfigureSkins();
      }

      if(m_headCode != Rheadcode)
      {
        m_headCode = Rheadcode;
        ConfigureHeadcodeLamps(m_headCode);
      }

			//bool Rwheesh = ReceivedData.GetNamedTagAsBool("wheesh");

			//if(Rwheesh and !Wheeshing)
			//{
			//	PostMessage(me, "pfx", "+4",0.0);
			//} else if(!Rwheesh and Wheeshing) {
			//	PostMessage(me, "pfx", "-4",0.0);
			//}
		}
	}

  // ============================================================================
  // Name: UpdateSmoke()
  // Desc: Update all smoke values.
  // ============================================================================
  void UpdateSmoke()
  {

  }

  // ============================================================================
  // Name: GetMenuHTML()
  // Desc: Browser HTML tabs.
  // ============================================================================

  string GetMenuHTML()
  {
  	//StringTable strTable = GetAsset().GetStringTable();
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<a href='live://open_eye'><img kuid='<kuid:414976:103313>' width=500 height=30></a>");
    output.Print("<br>");
    output.Print("<a href='live://open_loco'>Locomotive Window</a>");
    output.Print("<br>");
    output.Print("<a href='live://open_smoke'>Smoke Controllers</a>");
  	output.Print("</body></html>");

  	return output.AsString();
  }


  string GetEyeWindowHTML()
  {
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
  	output.Print("<table>");

    output.Print("<tr><td>");
    output.Print("<a href='live://return' tooltip='Return to the main tab selection'><b><font>Menu</font></b></a>");
    output.Print("</tr></td>");

    //Options
    output.Print("<tr><td>");
    output.Print("<font><b>Eye Controls</font>");
    output.Print("<br>");
    output.Print("<a href='live://eye-reset' tooltip='reset'><font>Reset Controls</font></a>");
    output.Print("</tr></td>");

    //controls
    output.Print("<tr><td>");
    output.Print("Eye Rotation Left/Right:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeX' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print("Eye Rotation Up/Down:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeY' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    //dial is no longer advanced lol
    output.Print("<tr><td>");
    output.Print("<trainz-object style=dial width=100 height=100 id='eyeZ' texture='newdriver/dcc/dcc_controller.tga' min=0.0 max=1.0 valmin=0.0 valmax=360.0 step=0 clickstep=1 value=0.0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print("<a href='live://record'><font>Start Recording</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://record-stop'><font>Stop Recording</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://play'><font>Play Animation</font></a>");
    output.Print("</tr></td>");

    output.Print("</table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetLocoWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
  	output.Print("<table>");

    output.Print("<tr><td>");
    output.Print("<a href='live://return' tooltip='Return to the main tab selection'><b><font>Menu</font></b></a>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-wheelslip", b_WheelslipEnabled));
    output.Print(" Wheelslip");
    output.Print("</tr></td>");
    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }

  string GetSmokeWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<table>");

    output.Print("<tr><td>");
    output.Print("<a href='live://return' tooltip='Return to the main tab selection'><b><font>Menu</font></b></a>");
    output.Print("</tr></td>");

    //Generate smoke containers
    int i;
    for(i = 0; i < SmokeEdits.CountTags(); i++)
    {
      Soup CurrentSmoke = SmokeEdits.GetNamedSoup((string)i);
      output.Print("<tr><td>");
      output.Print("<b>");
      output.Print("smoke" + (string)i + " ");

      if(CurrentSmoke.GetNamedTagAsBool("expanded")) output.Print("<a href='live://contract/" + (string)i + "'>-</a>");
      else output.Print("<a href='live://expand/" + (string)i + "'>+</a>");

      output.Print("</b>");
      output.Print("<br>");
      if(CurrentSmoke.GetNamedTagAsBool("expanded"))
      {
        output.Print("<table>");
        int curProperty;
        for(curProperty = 0; curProperty < CurrentSmoke.CountTags(); curProperty++)
        {
          string curTagName = CurrentSmoke.GetIndexedTagName(curProperty);
          if(curTagName != "active" and curTagName != "expanded")
          {
            output.Print("<tr><td>");
            output.Print(curTagName);
            output.Print("<br>");
            string foundValue = (string)CurrentSmoke.GetNamedTagAsFloat(curTagName);
            Str.TrimRight(foundValue, "0");
            Str.TrimRight(foundValue, ".");
            output.Print("<trainz-object style=slider horizontal theme=standard-slider width=200 height=16 id='" + (string)i + curTagName + "' min=0.0 max=8.0 value=0.0 page-size=0.5 draw-marks=1 draw-lines=1></trainz-object>");
            output.Print("<br>");
            output.Print((string)CurrentSmoke.GetNamedTagAsFloat(curTagName));
            output.Print("<br>");
            output.Print("</tr></td>");
          }
        }
        output.Print("</table>");
      }
      output.Print("</tr></td>");
    }

    output.Print("<tr><td>");
    output.Print("<a href='live://smoke-apply'>Apply</a>");
    output.Print("</tr></td>");

    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }

  // ============================================================================
  // Name: createMenuWindow()
  // Desc: Creates the browser.
  // ============================================================================

  void createMenuWindow()
  {
    browser = null;
    if ( !browser )	browser = Constructors.NewBrowser();
    browser.SetCloseEnabled(true);
  	browser.SetWindowPosition(Interface.GetDisplayWidth()-450, Interface.GetDisplayHeight() - 625);
  	browser.SetWindowSize(300, 350);
  	browser.SetWindowVisible(true);
  	browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    BrowserClosed = false;
  }

  // ============================================================================
  // Name: RefreshBrowser()
  // Desc: Updates all browser parameters by reloading the HTML strings.
  // ============================================================================

  void RefreshBrowser()
  {
    switch(CurrentMenu)
    {
      case BROWSER_MAINMENU:
      browser.LoadHTMLString(GetAsset(), GetMenuHTML());
      break;
      case BROWSER_EYEMENU:
      browser.LoadHTMLString(GetAsset(), GetEyeWindowHTML());
      break;
      case BROWSER_LOCOMENU:
      browser.LoadHTMLString(GetAsset(), GetLocoWindowHTML());
      break;
      case BROWSER_SMOKEMENU:
      browser.LoadHTMLString(GetAsset(), GetSmokeWindowHTML());

      int i;
      for(i = 0; i < SmokeEdits.CountTags(); i++)
      {
        Soup CurrentSmoke = SmokeEdits.GetNamedSoup((string)i);
        int curProperty;
        for(curProperty = 0; curProperty < CurrentSmoke.CountTags(); curProperty++)
        {
          string curTagName = CurrentSmoke.GetIndexedTagName(curProperty);
          if(curTagName != "active" and curTagName != "expanded")
          {
            string id = (string)i + curTagName;
            browser.SetElementProperty(id, "value", (string)CurrentSmoke.GetNamedTagAsFloat(curTagName));
          }
        }
      }

      break;
      default:
      browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    }
  }

  // ============================================================================
  // Name: BrowserThread()
  // Desc: Recreates the browser if it is closed. (should be swapped for a module change handler)
  // ============================================================================

  thread void BrowserThread()
  {
    while(true)
    {
      if (!HasFocus)
      {
        browser = null;
        BrowserClosed = true;
      }
      if (HasFocus and BrowserClosed)
      {
        //replace this with keybind
        createMenuWindow();
        BrowserClosed = false;
      }

      Sleep(0.1);
    }
  }

  // ============================================================================
  // Name: ScanBrowser()
  // Desc: Handles all browser input.
  // ============================================================================

  thread void ScanBrowser() {
		Message msg;
		wait(){
      //Eye Window
      on "Browser-URL", "live://open_eye", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_EYEMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Loco Window
      on "Browser-URL", "live://open_loco", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_LOCOMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://property/loco-wheelslip", msg:
      if ( browser and msg.src == browser )
      {
          b_WheelslipEnabled = !b_WheelslipEnabled;
          if(b_WheelslipEnabled)
          {
            normal_maxtractiveeffort = GetMaximumTractiveEffort();
            normal_traction = GetWheelslipTractionMultiplier();
            normal_momentum = GetWheelslipMomentumMultiplier();

            SetMaximumTractiveEffort(0.01);
            SetWheelslipTractionMultiplier(1.0);
            SetWheelslipMomentumMultiplier(0.1);
          }
          else
          {
            SetMaximumTractiveEffort(normal_maxtractiveeffort);
            SetWheelslipTractionMultiplier(normal_traction);
            SetWheelslipMomentumMultiplier(normal_momentum);
          }
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Smoke Window
      on "Browser-URL", "live://open_smoke", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_SMOKEMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Main Window
      on "Browser-URL", "live://return", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_MAINMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://eye-reset", msg:
      if ( browser and msg.src == browser )
      {
  		  browser.SetElementProperty("eyeX","value",(string)0.0);
  		  browser.SetElementProperty("eyeY","value",(string)0.0);
  		  browser.SetElementProperty("eyeZ","value",(string)0.0);
      }
      msg.src = null;
      continue;

		  on "Browser-URL", "live://record", msg:
      if ( browser and msg.src == browser )
      {
  			//recording = true;
  			//record();
      }
      msg.src = null;
      continue;

	    on "Browser-URL", "live://record-stop", msg:
      if ( browser and msg.src == browser )
      {
			     //recording = false;
      }
      msg.src = null;
      continue;

	    on "Browser-URL", "live://play", msg:
      if ( browser and msg.src == browser )
      {
		       //playanim();
      }
      msg.src = null;
      continue;

      //other messages
      on "Browser-URL", "", msg:
      if ( browser and msg.src == browser )
      {
		       if(TrainUtil.HasPrefix(msg.minor, "live://contract/"))
           {
             string command = Str.Tokens(msg.minor, "live://contract/")[0];
             if(command)
             {
               Soup smoke = SmokeEdits.GetNamedSoup(command);
               smoke.SetNamedTag("expanded", false);
               RefreshBrowser();
             }
           }
           if(TrainUtil.HasPrefix(msg.minor, "live://expand/"))
            {
              string command = Str.Tokens(msg.minor, "live://expand/")[0];
              if(command)
              {
                Soup smoke = SmokeEdits.GetNamedSoup(command);
                smoke.SetNamedTag("expanded", true);
                RefreshBrowser();
              }
            }
      }
      msg.src = null;
      continue;

      on "Browser-Closed", "", msg:
      {
      if ( browser and msg.src == browser ) browser = null;
        //BrowserClosed = true;
      }
      msg.src = null;
      continue;
      on "Camera","Target-Changed", msg:
      {
        if(msg.src == me) HasFocus = true;
        else HasFocus = false;
      }
      msg.src = null;
      continue;

      Sleep(0.5);
		}
	}



};
