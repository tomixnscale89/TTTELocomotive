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


  Soup ExtensionsContainer;
  Soup FacesContainer;
  Soup LiveryContainer;
  Soup SmokeboxContainer;

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

  AsyncObjectSearchResult WorldObjects;
  MapObject EyeTarget;

  //Browser interface
  Browser browser;
  define int BROWSER_MAINMENU = 0;
  define int BROWSER_EYEMENU = 1;
  define int BROWSER_LOCOMENU = 2;

  int CurrentMenu = BROWSER_MAINMENU;
  bool HasFocus = false;
  bool BrowserClosed;

  //tab specific Options
  bool b_WheelslipEnabled = false;
  bool b_EyeTargetEnabled = false;

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

  ExtensionsContainer = me.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
  FacesContainer = ExtensionsContainer.GetNamedSoup("faces");
  LiveryContainer = ExtensionsContainer.GetNamedSoup("liveries");
  SmokeboxContainer = ExtensionsContainer.GetNamedSoup("smokeboxes");

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

  AddHandler(me, "ControlSet", "eye-fl", "HandleKeyFLeft");
  AddHandler(me, "ControlSet", "eye-fr", "HandleKeyFRight");
  AddHandler(me, "ControlSet", "eye-wh", "HandleWheesh");
  AddHandler(me, "ControlSet", "eye-wh-up", "HandleWheeshUp");


  //Multiplayer Message! Important!
  AddHandler(me, "EyescriptMP", "update", "MPUpdate");

  EyeScriptCheckThread();
  if(MultiplayerGame.IsActive()){
    MultiplayerBroadcast();
  }

  WorldObjects = World.GetNamedObjectList("", "", false);

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

      //Property lists are the only way to easily display a list as far as i know
      html = html + "<a href=live://property/eye_target>Set Eye Lock Target</a>";

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
    else if (p_propertyID == "eye_target")
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
    if (p_propertyID == "eye_target")
    {
      return "Eye Lock Target";
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
    else if(p_propertyID == "eye_target")
    {
      return "Select an eye target:";
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
    else if (p_propertyID == "eye_target")
    {
      //Find all relevant objects
      //if(WorldObjects.SynchronouslyWaitForResults("AsyncLoadComplete"))
      //{
        NamedObjectInfo[] ObjectResults = WorldObjects.GetResults();
        for(i = 0; i < ObjectResults.size(); i++) // Let us loop through the entire possible skins and list them all.
        {
          result[i] = ObjectResults[i].localisedUsername;
        }
      //}
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
    else if (p_propertyID == "eye_target")
    {
      //if(WorldObjects.SynchronouslyWaitForResults("AsyncLoadComplete"))
      //{
        NamedObjectInfo[] ObjectResults = WorldObjects.GetResults();
        EyeTarget = cast<MapObject>ObjectResults[p_index].objectRef;
      //}
    }
    else
    {
      inherited(p_propertyID, p_value, p_index);
    }
  }


  void SetEyeMeshOrientation(float x, float y, float z)
	{
    SetMeshOrientation("eye_l", x, y, z);
		SetMeshOrientation("eye_r", x, y, z);
	}

  public void HandleXAxis(Message msg)
  {
    Soup parameters = msg.paramSoup;
    parameters.GetNamedTagAsFloat("control-value");
    eyeX = (parameters.GetNamedTagAsFloat("control-value") - 0.5)/1;
    SetEyeMeshOrientation(eyeY, eyeZ, eyeX);
  }

  public void HandleYAxis(Message msg)
  {
    Soup parameters = msg.paramSoup;
    parameters.GetNamedTagAsFloat("control-value");
    eyeY = -(parameters.GetNamedTagAsFloat("control-value") - 0.5)/1;
    SetEyeMeshOrientation(eyeY, eyeZ, eyeX);
  }

  //Face changing
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
    if (faceSelection < FacesContainer.CountTags())
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

  float floor(float input)
  {
    return Str.ToFloat(Str.Tokens((string)input, ".")[0]);
  }

  float normalizeAngle(float angle)
  {
    float fraction = angle / (Math.PI * 2);
    return (fraction - floor(fraction)) * (Math.PI * 2);
  }

  //Eyescript look functions
  float DotProduct(float[] vecA, float[] vecB) // verified working
  {
    float product = 0;
    int i;
    for (i = 0; i < 3; i++)
    {
      product = product + vecA[i] * vecB[i];
    }
    return product;
  }

  float[] CrossProduct(float[] vector_a, float[] vector_b) // verified working
  {
    float[] output = new float[3];
    output[0] = vector_a[1] * vector_b[2] - vector_a[2] * vector_b[1];
    output[1] = vector_a[0] * vector_b[2] - vector_a[2] * vector_b[0];
    output[2] = vector_a[0] * vector_b[1] - vector_a[1] * vector_b[0];
    return output;
  }

  float[] WCtoGlobal(WorldCoordinate Coord) // verified working
  {
    float[] output = new float[3];
    output[0] = Coord.x + Coord.baseboardX * 720;
    output[1] = Coord.y + Coord.baseboardY * 720;
    output[2] = Coord.z;
    return output;
  }

  float sqr(float x)
  {
        return x * x;
  }

  float sin(float x)
  {
      int a = (int)(x / (2 * Math.PI));
      x = x - 2 * a * Math.PI;
      a = 1;

      if(Math.PI < x and x <= 2 * Math.PI) {
          x = x - Math.PI;
          a = -a;
      }
      if(Math.PI / 2 < x and x <= Math.PI) {
          x = Math.PI - x;
      }

      return a * (x - x*x*x / 6 + x*x*x*x*x / 120 - x*x*x*x*x*x*x / 5040 + x*x*x*x*x*x*x*x*x / 362880);
  }

  float cos(float x)
  {
    return Math.Sqrt(1 - sqr(sin(x)));
  }

  float atan(float x)
  {
    return (Math.PI/4)*x - x*(Math.Fabs(x) - 1)*(0.2447 + 0.0663*Math.Fabs(x));
  }

  float asin(float x)
  {
    //return x*(1+x*x*(1/6+ x*x*(3/(2*4*5) + x*x*((1*3*5)/(2*4*6*7)))));
    return atan(x/(Math.Sqrt(1-sqr(x))));
  }

  float acos(float x)
  {
    return atan((Math.Sqrt(1-sqr(x)))/x);
  }



  float[] normalize(float[] p) // verified working
  {
    float[] output = new float[3];
    float w = Math.Sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
    output[0] = p[0] / w;
    output[1] = p[1] / w;
    output[2] = p[2] / w;
    return output;
  }

  float atan2(float y, float x) // verified working
  {
      float ONEQTR_PI = Math.PI / 4.0;
    	float THRQTR_PI = 3.0 * Math.PI / 4.0;
      float r;
      float retangle;
    	float abs_y = Math.Fabs(y) + 0.0000000001;      // kludge to prevent 0/0 condition
    	if ( x < 0.0 )
    	{
    		r = (x + abs_y) / (abs_y - x);
    		retangle = THRQTR_PI;
    	}
    	else
    	{
    		r = (x - abs_y) / (x + abs_y);
    		retangle = ONEQTR_PI;
    	}
    	retangle = retangle + (0.1963 * r * r - 0.9817) * r;
    	if ( y < 0.0 ) return -retangle;

      return retangle;
  }

  float[] toEuler(float x, float y, float z, float angle)
  {
    float heading = 0.0;
    float attitude = 0.0;
    float bank = 0.0;

    TrainzScript.Log("Angle is " + (string)angle);
  	float s = sin(angle);
  	float c = cos(angle);
  	float t = 1 - c;

  	if ((x*y*t + z*s) > 0.998) { // north pole singularity detected
      TrainzScript.Log("north pole singularity");
  		heading = 2 * atan2(x * sin(angle / 2), cos(angle / 2));
  		attitude = Math.PI / 2;
  		bank = 0;
  	}
  	else if ((x*y*t + z*s) < -0.998) { // south pole singularity detected
      TrainzScript.Log("south pole singularity");
  		heading = -2 * atan2(x * sin(angle / 2), cos(angle / 2));
  		attitude = -Math.PI / 2;
  		bank = 0;
  	}
    else
    {
      heading = atan2(y * s - x * z * t , 1 - (y*y+ z*z) * t);
      attitude = asin(x * y * t + z * s);
      bank = atan2(x * s - y * z * t , 1 - (x*x + z*z) * t);
    }
    TrainzScript.Log("heading " + (string)heading + " bank " + (string)bank + " attitude " + (string)attitude + " s " + (string)s + " c " + (string)c + " t " + (string)t);
    float[] output = new float[3];
    output[0] = heading;
    output[1] = attitude;
    output[2] = bank;
    return output;
  }

  float[] GetLookAngle(WorldCoordinate Start, WorldCoordinate End)
  {
    float[] StartGlobal = WCtoGlobal(Start);
    float[] EndGlobal = WCtoGlobal(End);

    TrainzScript.Log("normalized angle is " + (string)normalizeAngle(DotProduct(StartGlobal, EndGlobal)));
    float NewAngle = acos(normalizeAngle(DotProduct(StartGlobal, EndGlobal)));
    float[] NewAxis = normalize(CrossProduct(StartGlobal, EndGlobal));

    return toEuler(NewAxis[0], NewAxis[1], NewAxis[2], NewAngle);
  }

	thread void EyeScriptCheckThread() {
		while(true) {
      //warning - this runs at the same speed as the eyescript, and can be performance heavy due to this
      //increase the update period if this is the case

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
      if (CurrentMenu == BROWSER_EYEMENU and !BrowserClosed)
      {
        eyeX = Str.ToFloat(browser.GetElementProperty("eyeX", "value")) * Math.PI / 180;
        eyeY = Str.ToFloat(browser.GetElementProperty("eyeY", "value")) * Math.PI / 180;
        eyeZ = Str.ToFloat(browser.GetElementProperty("eyeZ", "value")) * Math.PI / 180;
      }

      if(b_EyeTargetEnabled and EyeTarget)
      {
        float[] TargetAngle = GetLookAngle(me.GetMapObjectPosition(), EyeTarget.GetMapObjectPosition());

        float[] StartGlobal = WCtoGlobal(me.GetMapObjectPosition());
        float[] EndGlobal = WCtoGlobal(EyeTarget.GetMapObjectPosition());

        TrainzScript.Log("sin " + (string)sin(0.5) + " cos " + (string)cos(0.5) + " asin " + (string)asin(sin(0.5)) + " acos " + (string)acos(cos(0.5)));

        //TrainzScript.Log("CP is: X: " + (string)CP[0] + " Y: " + (string)CP[1] + " Z: " + (string)CP[2]);
        //TrainzScript.Log("Normalized is: X: " + (string)NewAxis[0] + " Y: " + (string)NewAxis[1] + " Z: " + (string)NewAxis[2]);
        //TrainzScript.Log("pos is: X: " + (string)WCtoGlobal(me.GetMapObjectPosition())[0] + " Y: " + (string)WCtoGlobal(me.GetMapObjectPosition())[1] + " Z: " + (string)WCtoGlobal(me.GetMapObjectPosition())[2]);

        TrainzScript.Log("Target Angle is: X: " + (string)TargetAngle[0] + " Y: " + (string)TargetAngle[1] + " Z: " + (string)TargetAngle[2]);
        eyeX = TargetAngle[1];
        eyeY = TargetAngle[0];
        eyeZ = TargetAngle[2];
      }

			//final orientation apply ================================================
			SetEyeMeshOrientation(eyeY, eyeZ, eyeX);

			Sleep(eye_UpdatePeriod);
		}
	}


  //This section of the code handles the multiplayer, using some epic advanced soup business

  //sends a message to other game clients
	thread void MultiplayerBroadcast() {
		while(true)
		{
			//CHECK FOR CLIENT OWNERSHIP, OTHERWISE IT WILL GET MESSY
			DriverCharacter driver = me.GetMyTrain().GetActiveDriver();
			if (MultiplayerGame.IsActive() and driver and driver.IsLocalPlayerOwner()) {

				//this thread will package up data and send it across the server to be listened for
				Soup senddata = Constructors.NewSoup();       // this soup will be empty
        senddata.SetNamedTag("eyeX",eyeX);
        senddata.SetNamedTag("eyeY",eyeY);
        senddata.SetNamedTag("eyeZ",eyeZ);
				senddata.SetNamedTag("face", faceSelection);
        senddata.SetNamedTag("skin",skinSelection);
        senddata.SetNamedTag("headcode",m_headCode);
				//senddata.SetNamedTag("wheesh",Wheeshing);
				senddata.SetNamedTag("id",me.GetGameObjectID());
				MultiplayerGame.BroadcastGameplayMessage("EyescriptMP", "update", senddata);
			}
			Sleep(MP_UpdatePeriod); // don't go too crazy with data
		}
	}

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


  string GetMenuHTML()
  {
  	//StringTable strTable = GetAsset().GetStringTable();
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<a href='live://open_eye'><img kuid='<kuid:414976:103313>' width=500 height=30></a>");
    output.Print("<br>");
    output.Print("<a href='live://open_loco'>Locomotive Window</a>");
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
    output.Print("</td></tr>");

    //Options
    output.Print("<tr><td>");
    output.Print("<font><b>Eye Controls</font>");
    output.Print("<br>");
    output.Print("<a href='live://eye-reset' tooltip='reset'><font>Reset Controls</font></a>");
    output.Print("</td></tr>");

    //controls
    output.Print("<tr><td>");
    output.Print("Eye Rotation Left/Right:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeX' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print("Eye Rotation Up/Down:");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeY' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</td></tr>");

    //dial is no longer advanced lol
    output.Print("<tr><td>");
    output.Print("<trainz-object style=dial width=100 height=100 id='eyeZ' texture='newdriver/dcc/dcc_controller.tga' min=0.0 max=1.0 valmin=0.0 valmax=360.0 step=0 clickstep=1 value=0.0></trainz-object>");
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print("<a href='live://record'><font>Start Recording</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://record-stop'><font>Stop Recording</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://play'><font>Play Animation</font></a>");
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://eye-target", b_EyeTargetEnabled) + " Enable Eye Target");
    output.Print("</td></tr>");

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
    output.Print(HTMLWindow.CheckBox("live://property/loco-wheelslip", b_WheelslipEnabled));
    output.Print(" Wheelslip");
    output.Print("</td></tr>");
    output.Print("</table>");
    output.Print("</body></html>");

    return output.AsString();
  }

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
      default:
      browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    }
  }

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

      on "Browser-URL", "live://eye-target", msg:
      if ( browser and msg.src == browser )
      {
          b_EyeTargetEnabled = !b_EyeTargetEnabled;
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
          Bogey[] testBogies = me.GetBogeyList();
          if(b_WheelslipEnabled)
          {
            int i;
            for(i = 0; i < testBogies.size(); i++)
            {
              //testBogies[i].SetMeshAnimationSpeed("default", 4.0);
            }
          }
          else
          {
            int i;
            for(i = 0; i < testBogies.size(); i++)
            {
              //testBogies[i].SetMeshAnimationSpeed("default", 1.0);
            }
          }
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
