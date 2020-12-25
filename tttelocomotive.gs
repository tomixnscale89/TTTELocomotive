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
// Localization:
// Ermelber / SkyArcher - Italian
// Gericom - Dutch
// ILIOS - Russian
// ============================================================================

include "locomotive.gs"
include	"meshobject.gs"
include "interface.gs"
include "orientation.gs"
include "multiplayergame.gs"
include "trainzassetsearch.gs"
include "soup.gs"
include "couple.gs" //procedural coupler <kuid:414976:104101> Procedural Coupler

// ============================================================================
// IMPORTANT INFORMATION:
// ============================================================================
// In order to use this script, a string-table MUST be present in the locomotive/wagon config.
// If the string-table is NOT present, then most of the text shown in this script will not be visible and will be broken.
// We use string-tables to support custom languages if need be.
// For information on custom languages with string-table, see: http://online.ts2009.com/mediaWiki/index.php/%22String-table%22_container

//
// Version 1.0 Languages:
// English
// Dutch
// Spanish
// Italian
// Russian

//
// The standard, required, ENGLISH string-table is as follows:
//
// string-table
// {
// trainz_ver_debug                      "The Trainz-Build number is: "
// headcode_none                         "None"
// headcode_all                          "All Lamps"
// headcode_tail                         "Tail Lights"
// headcode_branch                       "Branchline"
// headcode_express                      "Express Passenger"
// headcode_express_f1                   "Express Freight 1"
// headcode_express_f2                   "Express Freight 2"
// headcode_express_f3                   "Express Freight 3"
// headcode_goods                        "Goods"
// headcode_light                        "Light"
// headcode_thru_freight                 "Through Freight"
// headcode_tvs                          "TV Series Configuration"
// headcode_name                         "Headcodes"
// headcode_select                       "Currently equipped headcode: $0."
// headcode_description                  "Select a Headcode from the following options:"
// skin_name                             "Liveries"
// skin_select                           "Currently selected Livery: $0."
// skin_description                      "Select a Livery from the following options:"
// faces_name                            "Faces"
// faces_select                          "Currently selected face: $0."
// faces_description                     "Select a Face from the following options:"
// menu                                  "Menu"
// tooltip_return                        "Return to the main menu."
// tooltip_reset                         "Reset Eye Controls"
// eye_menu                              "Eye Controls"
// eye_rotation_h                        "Eye Rotation Left/Right:"
// eye_rotation_v                        "Eye Rotation Up/Down:"
// reset_controls                        "Reset Controls"
// recording_start                       "Start Recording"
// recording_stop                        "Stop Recording"
// recording_anim                        "Play Animation"
// target_lock                           "Eye Tracking"
// target_select                         "Start Eye Tracking"
// target_select_eye                     "Select Object for Eyes to Follow"
// target_looking                        "Select a Train, Wagon, or Automobile...."
// wheelslip                             "Wheelslip (Only active in Realistic Mode)"
// shake                                 "Shake"
// shake_intensity                       "Shake Intensity: "
// shake_period                          "Shake Period: "
// couple_disable                        "Disable Coupling"
// couple_disable_desc                   "Disable couplers to allow shunting operations."
// bind_wheesh                           "(bind to wheesh)"
// }



// ============================================================================
// TO DO:
// Work on a more efficient Livery system.
// Make sure coupler support works with non-Pro Coupler assets.
// Add more Tooltips for some options on the Menus to make the options clearer.
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

  Soup GlobalTTTESettings;

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
  bool SoupHasTag(Soup testSoup, string tagName);
  void SetLampEffects(MeshObject headlightMeshObject,bool headlighton, bool highbeam_state);
  thread void CheckScriptAssetObsolete();

  thread void EyeScriptCheckThread(void);
  thread void JoystickThread(void);
  thread void BufferThread();
  void SetEyeMeshOrientation(float x, float y, float z);
  thread void MultiplayerBroadcast(void);
  void createMenuWindow();
  thread void BrowserThread();
  thread void ScanBrowser(void);
  void RefreshBrowser();

  void WhistleMonitor(Message msg);
  thread void HeadlightMonitor();

  //Math
  float ApproxAtan2(float y, float x);
  WorldCoordinate RotatePoint(WorldCoordinate point, float rotateangle);
  Orientation LookAt(WorldCoordinate A, WorldCoordinate B);
  Orientation DeltaRot(Orientation From, Orientation To);
  float rad_range(float in_x);
  float clamp(float x, float lower, float upper);
   // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/
  Asset ScriptAsset;
  StringTable strTable; // This asset's string table, saved for convenient fast access
  bool AssetObsolete = false;
  KUID ObsoletedBy;

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

  int skinSelection; // Integer used to store the current skin of the asset. This will default to zero, unless forced in Init().
  int m_copySkin; // May not be needed..
  int m_copySkinBogey;

  // Faces Options
  int faceSelection;

  Soup myConfig;
  Soup ExtensionsContainer;
  Soup FacesContainer;
  Soup LiveryContainer;
  Soup LiveryTextureOptions;
  Soup BogeyLiveryTextureOptions;
  Soup SmokeboxContainer;
  Soup BuffersContainer;
  Soup ExtraLampsContainer;
  bool[] ExtraLampVisibility;
  Asset[] ExtraLampAssets;

  Soup SmokeEdits;
  int BoundWheesh = -1;
  // ACS Stuff
  Library     ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams; // not sure what this is

  IKCoupler FrontCoupler;
  IKCoupler BackCoupler;
  Vehicle LastCoupleInteraction;

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

  bool useLockTarget = false;
  bool selectingTarget = false;
  MapObject eyeLockTarget;

  //unimplemented keyboard control vars
  define bool eye_ControllerAbsolute = true; //unimplemented
  define float eye_Speed = 0.1;
  bool eye_UpPressed, eye_DownPressed, eye_LeftPressed, eye_RightPressed, eye_RollLeftPressed, eye_RollRightPressed;

  //Browser interface
  Browser browser;
  define int BROWSER_MAINMENU = 0;
  define int BROWSER_EYEMENU = 1;
  define int BROWSER_JOYSTICKMENU = 2;
  define int BROWSER_LAMPMENU = 3;
  define int BROWSER_LIVERYMENU = 4;
  define int BROWSER_FACEMENU = 5;
  define int BROWSER_LOCOMENU = 6;
  define int BROWSER_SMOKEMENU = 7;

  int CurrentMenu = BROWSER_MAINMENU;
  bool HasFocus = false;
  bool BrowserClosed;

  //tab specific Options
  bool b_WheelslipEnabled = false;
  bool b_ShakeEnabled = false;
  float b_ShakeIntensity = 0.02;
  float b_ShakePeriod = 0.04;
  bool b_CoupleLockEnabled = false;
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

    ScriptAsset = World.GetLibrary(GetAsset().LookupKUIDTable("tttelocomotive")).GetAsset();
    CheckScriptAssetObsolete();

    //TrainzScript.Log("searching for ttte settings lib");
    // tttelib TTTELocoLibrary = cast<tttelib>World.GetLibrary(GetAsset().LookupKUIDTable("tttelocomotive"));

    //if(TTTELocoLibrary)
    //{
      //TrainzScript.Log("Found TTTE settings library!");
      //GlobalTTTESettings = TTTELocoLibrary.GetSettings();
      //TrainzScript.Log("settings library is " + GlobalTTTESettings.AsString());
    //}

    // ****************************************************************************/
   // Grab assets from the Locomotive
   // ****************************************************************************/
  strTable = ScriptAsset.GetStringTable(); // String table to be used for obtaining information inside the Config

  myBogies = me.GetBogeyList(); // Grab all of the bogies on the locomotive, specifically for swapping texture purposes.

  faceSelection = 0; // Since we are assuming the locomotive has a face, let's set it to zero so the default face will appear.

  myConfig = me.GetAsset().GetConfigSoup();
  ExtensionsContainer = me.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
  BuffersContainer = ExtensionsContainer.GetNamedSoup("buffers");
  if(BuffersContainer.CountTags() > 0)
  {
    BufferThread();
  }
  FacesContainer = ExtensionsContainer.GetNamedSoup("faces");
  LiveryContainer = ExtensionsContainer.GetNamedSoup("liveries");
  ExtraLampsContainer = ExtensionsContainer.GetNamedSoup("extra-lamps");
  LiveryTextureOptions = ExtensionsContainer.GetNamedSoup("livery-textures");
  BogeyLiveryTextureOptions = ExtensionsContainer.GetNamedSoup("bogey-livery-textures");

  //liverytextureoptions defines the texture autofill behavior
  //SUPPORTED OPTIONS: none, diffusenormal, pbrstandard

  //set initial extra lamp states to none
  if(ExtraLampsContainer)
  {
    int TagCount = ExtraLampsContainer.CountTags();
    ExtraLampAssets = new Asset[TagCount];
    ExtraLampVisibility = new bool[TagCount];
    int i;
    for(i = 0; i < TagCount; i++)
    {
      string effectName = ExtraLampsContainer.GetIndexedTagName(i);
      MeshObject lampMesh = GetFXAttachment(effectName);
      ExtraLampVisibility[i] = false;
      if(lampMesh)
      {
        ExtraLampAssets[i] = lampMesh.GetAsset();
        SetFXAttachment(effectName, null);
      }
      else
        ExtraLampAssets[i] = null;
    }
  }

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
      ParticleCount++;
    }
  }

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
  AddHandler(me, "ControlSet", "eye-wheesh", "HandleWheesh"); //now analog

  AddHandler(me, "Interface-Event", "Left-Click", "EyeTargetChanged");

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

  //Procedural Coupler System
  FrontCoupler = cast<IKCoupler>(GetFXAttachment("couple_front"));
  BackCoupler = cast<IKCoupler>(GetFXAttachment("couple_back"));
  //important
  if(FrontCoupler)
    FrontCoupler.PostInit(me, "front");
  if(BackCoupler)
    BackCoupler.PostInit(me, "back");

  //FrontCoupler.ParentVehicle = me;
  //BackCoupler.ParentVehicle = me;
  //FrontCoupler.Position = "front";
  //BackCoupler.Position = "back";
  //FrontCoupler.SetCoupleTarget(0.0, -1.0, 0.0, 0.0);
  //BackCoupler.SetCoupleTarget(0.0, -1.0, 0.0, 0.0);

  //create the browser menu - this could be changed later to link to a pantograph or keybind
  createMenuWindow();
  ScanBrowser();
  BrowserThread();

  Soup KUIDTable = myConfig.GetNamedSoup("kuid-table");
  // Idle coupler mesh must have a default-mesh tag in the effects container or else it will not show.
  if(SoupHasTag(KUIDTable, "coupler_idle")) coupler_idle = GetAsset().FindAsset("coupler_idle");
  if(SoupHasTag(KUIDTable, "coupler_coupled")) coupler_coupled = GetAsset().FindAsset("coupler_coupled");

  if(SoupHasTag(KUIDTable, "lamp")) headlight_asset = GetAsset().FindAsset("lamp");
  m_carPosition = DetermineCarPosition();

  if(SoupHasTag(KUIDTable, "liveries")) textureSet = GetAsset().FindAsset("liveries"); // Grab the textures we need for the livery swapping


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

  // Handler for Secondary Whistle PFX
  // AddHandler(me.GetMyTrain(), "Train", "NotifyHorn", "WhistleMonitor");


	train = me.GetMyTrain(); // Get the train
	SniffMyTrain(); // Then sniff it

    HeadlightMonitor();

  }

  int[] GetKuidData(KUID FoundKUID)
  {
    int[] ret;
    string kuidStr = FoundKUID.GetLogString();
    string[] tokens = Str.Tokens(kuidStr, "<:>");
    ret = new int[tokens.size() - 1]; //remove kuid/kuid2 token
    int i;
    for(i = 1; i < tokens.size(); i++)
      ret[i - 1] = Str.ToInt(tokens[i]);
    return ret;
  }

  void ShowUpdatePrompt()
  {
    TrainzScript.Log("showing update prompt for " + ObsoletedBy.GetLogString());
    TrainzScript.OpenURL("trainz://install/" + ObsoletedBy.GetLogString());
  }

  // ============================================================================
  // Name: IsScriptAssetObsolete()
  // Desc: Checks if TTTELocomotive has an update available on the Download Station.
  // ============================================================================
  thread void CheckScriptAssetObsolete()
  {
    TrainzScript.Log("Checking for updates...");
    //get all known versions of an asset
    int[] types = new int[2];
    string[] vals = new string[2];
    types[0] = TrainzAssetSearch.FILTER_LOCATION;  vals[0] = "dls";
    types[1] = TrainzAssetSearch.FILTER_KEYWORD;  vals[1] = "TTTELocomotive";
    //FILTER_UPDATE_AVAIL
    //FILTER_KUID
    AsyncTrainzAssetSearchObject search = TrainzAssetSearch.NewAsyncSearchObject();
    TrainzAssetSearch.AsyncSearchAssetsSorted(types, vals, TrainzAssetSearch.SORT_KUID, false, search);
    search.SynchronouslyWaitForResults();
    Asset[] results = search.GetResults();

    KUID MyKUID = ScriptAsset.GetKUID();
    string myKuidStr = MyKUID.GetLogString();
    int[] MyKuidData = GetKuidData(MyKUID);
    int MyRevision = 0;
    if(MyKuidData.size() > 2)
      MyRevision = MyKuidData[2];

    int i;
    for(i = 0; i < results.size(); i++)
    {
      Asset FoundAsset = results[i];
      KUID FoundKUID = FoundAsset.GetKUID();
      int[] FoundKuidData = GetKuidData(FoundKUID);
      if(MyKuidData[0] == FoundKuidData[0] and MyKuidData[1] == FoundKuidData[1] and FoundKuidData.size() > 2)
      {
        int FoundRevision = FoundKuidData[2];
        if(FoundRevision > MyRevision)
        {
          TrainzScript.Log("Found newer revision " + FoundRevision + ". Asset KUID " + FoundKUID.GetLogString());
          //ShowUpdatePrompt(FoundKUID);
          AssetObsolete = true;
          ObsoletedBy = FoundKUID;
          break;
        }
      }

      //TrainzScript.Log("found " + FoundAsset.GetLocalisedName() + " " + FoundKUID.GetLogString());
    }

    if(browser) RefreshBrowser();
    //Asset[] assets = TrainzAssetSearch.SearchAssetsSorted(types, vals, TrainzAssetSearch.SORT_NAME, true);
  }

  // ============================================================================
  // Name: SetLampEffects(MeshObject headlightMeshObject, bool headlighton, bool highbeam_state)
  // Desc: SetLampEffects will check the current state of the headlight/highbeam and set the lamp to emit light with the HDR bloom trick.
  // ============================================================================
  void SetLampEffects(MeshObject headlightMeshObject, bool headlighton, bool highbeam_state)
  {
    // Will probably change this to a mesh to save on performance (if any impact)
    // It would be better if we can change the texture based on the Mesh Library asset itself, rather than the Lamp MeshObject directory.
    if (me == me.GetMyTrain().GetFrontmostLocomotive())
    {
      if(headlighton) // Headlights are on
      {
        if(highbeam_state) // Highbeams are on
        {
          headlightMeshObject.SetFXTextureReplacementTexture("lights_parameter", "marklin_frontlamp_handle_emissive/lamp_on_parameter.texture");
        }
        else // Highbeams are off
        {
          headlightMeshObject.SetFXTextureReplacementTexture("lights_parameter", "marklin_frontlamp_handle_emissive/lamp_on_parameter.texture");
        }
      }
      else // Headlights are off
      {
        headlightMeshObject.SetFXTextureReplacementTexture("lights_parameter", "marklin_frontlamp_handle_emissive/lamp_parameter.texture");
      }
    }
    else // We may be another train in the consist. Since we aren't the head unit, shut off any lights that may exist.
    {
      headlightMeshObject.SetFXTextureReplacementTexture("lights_parameter", "marklin_frontlamp_handle_emissive/lamp_parameter.texture");
    }
  }

  // ============================================================================
  // Name: ConfigureHeadLightCorona(bool headlighton, bool highbeam_state)
  // Desc: Sets up the Lamp meshes for the required state.Here we will compare the current values of the headcode to determine
  // which lamps will actually need to be changed. These will update based on the polling logic from HeadlightMonitor.
  // ============================================================================
  void ConfigureHeadLightCorona(bool headlighton, bool highbeam_state)
  {
    if ((m_headCode & HEADCODE_BL) != 0) SetLampEffects(GetFXAttachment("lamp_bl"), headlighton, highbeam_state);
    if ((m_headCode & HEADCODE_BC) != 0) SetLampEffects(GetFXAttachment("lamp_bc"), headlighton, highbeam_state);
    if ((m_headCode & HEADCODE_BR) != 0) SetLampEffects(GetFXAttachment("lamp_br"), headlighton, highbeam_state);
    if ((m_headCode & HEADCODE_TC) != 0) SetLampEffects(GetFXAttachment("lamp_tc"), headlighton, highbeam_state);
  }


    // ============================================================================
    // Name: HeadlightMonitor()
    // Desc: Sets the vehicle up for the required headlight
    // ============================================================================
    thread void HeadlightMonitor()
    {
      // Start off with legacy mode assumed. If we get a modern message we cancel it.
      bool bIsLegacyModeActive = true;
      PostMessage(me, "Updater", "LegacyTick", 1.0);
      wait()
      {
        on "Updater", "LegacyTick":
        // Legacy polling logic. Updates lights every second.
        ConfigureHeadLightCorona(me.GetMyTrain().GetHeadlightState(), me.GetHighBeams());
        PostMessage(me, "Updater", "LegacyTick", 1.0);
        continue;

        on "Train", "NotifyHeadlights":
        // Modern reactive logic. Updates lights only when changed.
        ConfigureHeadLightCorona(me.GetMyTrain().GetHeadlightState(), me.GetHighBeams());

        // Cancel legacy logic if still active
        if (bIsLegacyModeActive)
        {
          ClearMessages("Updater", "LegacyTick");
          bIsLegacyModeActive = false;
        }
        continue;
      }
    }


    // ============================================================================
    // Name: WhistleMonitor()
    // Desc: Watches Whistle interactions specifically when the message NotifyHorn is posted.
    //       Currently not working. Not sure of a way to obtain the Horn state.
    // ============================================================================
    void WhistleMonitor(Message msg)
    {
      // Interface.Print("Entered WhistleMonitor" + "GetEngineParam HORN is: " + GetEngineParam("horn"));
      if(msg.src == me)
      {
        if(GetEngineParam("horn") == 1)
        {
          PostMessage(me, "pfx", "+5",0.0); // Blow extra whistle
        }
        else
        {
          PostMessage(me, "pfx", "-5",0.0); // No longer in wait, so stop blowing whistle.
        }
      }
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
  // Name: GetNextVehicle(GSTrackSearch Search)
  // Desc:
  // ============================================================================

  Vehicle GetNextVehicle(GSTrackSearch Search)
  {
    Vehicle foundVehicle;
    while (Search.SearchNextObject())
    {
      foundVehicle = cast<Vehicle>Search.GetObject();
      if (foundVehicle != null)
        return foundVehicle;
    }
    return null;
  }

  // ============================================================================
  // Name: BufferThread()
  // Desc: Manages buffer interaction.
  // ============================================================================

  thread void BufferThread()
  {
    bool useFront = false;
    bool useBack = false;
    float FrontExtensionDistance = 0.0;
    float BackExtensionDistance = 0.0;
    string FrontMesh;
    string BackMesh;
    Soup FrontContainer = BuffersContainer.GetNamedSoup("front");
    Soup BackContainer = BuffersContainer.GetNamedSoup("back");
    if(FrontContainer.CountTags() > 0)
    {
      useFront = true;
      FrontExtensionDistance = Str.UnpackFloat(FrontContainer.GetNamedTag("extension-distance"));
      FrontMesh = FrontContainer.GetNamedTag("mesh");
    }
    if(BackContainer.CountTags() > 0)
    {
      useBack = true;
      BackExtensionDistance = Str.UnpackFloat(BackContainer.GetNamedTag("extension-distance"));
      BackMesh = BackContainer.GetNamedTag("mesh");
    }

    Vehicle CachedFrontVehicle;
    Vehicle CachedBackVehicle;
    bool IsFrontSprung = false;
    bool IsBackSprung = false;
    float HalfLength = GetLength() / 2;
    while(true)
    {
      if(useFront)
      {
        float TargetDistance = FrontExtensionDistance;

        GSTrackSearch Search = BeginTrackSearch(true);
        Vehicle FrontVehicle = GetNextVehicle(Search);
        if(FrontVehicle)
        {
          if(FrontVehicle != CachedFrontVehicle)
          {
            //new vehicle detected
            Asset vehicleasset = FrontVehicle.GetAsset();
            AsyncQueryHelper configcache = vehicleasset.CacheConfigSoup();
            configcache.SynchronouslyWaitForResults();
            Soup vehicleBufferContainer = vehicleasset.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("buffers");
            if(vehicleBufferContainer.CountTags() > 0) IsFrontSprung = true;
            else IsFrontSprung = false;
          }
          float NextHalfLength = FrontVehicle.GetLength() / 2;
          float CoupleDistance = (Search.GetDistance() - (HalfLength + NextHalfLength));
          if(IsFrontSprung) CoupleDistance = CoupleDistance / 2;

          if(CoupleDistance < FrontExtensionDistance) TargetDistance = CoupleDistance;
        }

        //TrainzScript.Log("Positive target distance is " + (string)TargetDistance);
        SetMeshTranslation(FrontMesh, 0.0, -TargetDistance, 0.0);
        CachedFrontVehicle = FrontVehicle;
      }

      if(useBack)
      {
        float TargetDistance = BackExtensionDistance;

        GSTrackSearch Search = BeginTrackSearch(false);
        Vehicle BackVehicle = GetNextVehicle(Search);
        if(BackVehicle)
        {
          if(BackVehicle != CachedBackVehicle)
          {
            //new vehicle detected
            Asset vehicleasset = BackVehicle.GetAsset();
            AsyncQueryHelper configcache = vehicleasset.CacheConfigSoup();
            configcache.SynchronouslyWaitForResults();
            Soup vehicleBufferContainer = vehicleasset.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("buffers");
            if(vehicleBufferContainer.CountTags() > 0) IsBackSprung = true;
            else IsBackSprung = false;
          }
          float NextHalfLength = BackVehicle.GetLength() / 2;
          float CoupleDistance = (Search.GetDistance() - (HalfLength + NextHalfLength));
          if(IsBackSprung) CoupleDistance = CoupleDistance / 2;

          if(CoupleDistance < BackExtensionDistance) TargetDistance = CoupleDistance;
        }

        SetMeshTranslation(BackMesh, 0.0, TargetDistance, 0.0);
        CachedBackVehicle = BackVehicle;
      }

      Sleep(0.03);
    }
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
  // Name: SoupHasTag()
  // Desc: Determine if a Soup contains a tag.
  // ============================================================================
  bool SoupHasTag(Soup testSoup, string tagName)
  {
    if(testSoup.GetIndexForNamedTag(tagName) == -1)
    {
      return false;
    }
    //return false if it doesnt exist, otherwise return true
    return true;
  }

  // ============================================================================
  // OBSOLETE. We are not using this function in the locomotive anymore, as it's a better idea
  // to have this check be done in the cabin for specific cases.
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

  // ============================================================================
  // Name: CameraInternalViewHandler(Message msg)
  // Parm:  Message msg
  // Desc:
  // ============================================================================
  void CameraInternalViewHandler(Message msg)
  {
    m_cameraViewpoint = (msg.minor == "Internal-View");
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
  // Name: ConfigureSkins()
  // Parm:  None
  // Desc:
  // ============================================================================
  void ConfigureSkins()
  {
    TrainzScript.Log("Setting skin to " + (string)skinSelection);

    int MainTextureGroupSize = 0;
    int BogeyTextureGroupSize = 0;
    //determine texturegroup offset
    int i;

    for(i = 0; i < LiveryTextureOptions.CountTags(); i++)
    {
      string TextureName = LiveryTextureOptions.GetIndexedTagName(i);
      string TextureMode = LiveryTextureOptions.GetNamedTag(TextureName);
      if(TextureMode == "none")
      {
        MainTextureGroupSize = MainTextureGroupSize + 1;
      }
      else if(TextureMode == "diffusenormal")
      {
        MainTextureGroupSize = MainTextureGroupSize + 2;
      }
      else if(TextureMode == "pbrstandard")
      {
        MainTextureGroupSize = MainTextureGroupSize + 3;
      }
    }
    for(i = 0; i < BogeyLiveryTextureOptions.CountTags(); i++)
    {
      string TextureName = BogeyLiveryTextureOptions.GetIndexedTagName(i);
      string TextureMode = BogeyLiveryTextureOptions.GetNamedTag(TextureName);
      if(TextureMode == "none")
      {
        BogeyTextureGroupSize = BogeyTextureGroupSize + 1;
      }
      else if(TextureMode == "diffusenormal")
      {
        BogeyTextureGroupSize = BogeyTextureGroupSize + 2;
      }
      else if(TextureMode == "pbrstandard")
      {
        BogeyTextureGroupSize = BogeyTextureGroupSize + 3;
      }
    }

    TrainzScript.Log("Found texturegroup size of " + (string)MainTextureGroupSize + " and bogey texturegroup size of " + (string)BogeyTextureGroupSize);

    //increment this value for each texture, to loop along
    //use texturegroup offset
    m_copySkin = skinSelection * (MainTextureGroupSize + BogeyTextureGroupSize);

    for(i = 0; i < LiveryTextureOptions.CountTags(); i++)
    {
      string TextureName = LiveryTextureOptions.GetIndexedTagName(i);
      string TextureMode = LiveryTextureOptions.GetNamedTag(TextureName);
      if(TextureMode == "none")
      {
        SetFXTextureReplacement(TextureName,textureSet,m_copySkin);
        m_copySkin = m_copySkin + 1;
      }
      else if(TextureMode == "diffusenormal")
      {
        SetFXTextureReplacement(TextureName + "_diffuse",textureSet,m_copySkin);
        SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkin + 1);
        m_copySkin = m_copySkin + 2;
      }
      else if(TextureMode == "pbrstandard")
      {
        SetFXTextureReplacement(TextureName + "_albedo",textureSet,m_copySkin);
        SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkin + 1);
        SetFXTextureReplacement(TextureName + "_parameter",textureSet,m_copySkin + 2);
        m_copySkin = m_copySkin + 3;
      }
      else
      {
        TrainzScript.Log("Livery mode " + TextureMode + " is not supported!");
      }
    }

    //bogey liveries

    int currentBogey;
    for(currentBogey = 0; currentBogey < myBogies.size(); currentBogey++)
    {
      if(myBogies[currentBogey])
      {
        m_copySkinBogey = m_copySkin;
        Bogey ActiveBogey = myBogies[currentBogey];

        for(i = 0; i < BogeyLiveryTextureOptions.CountTags(); i++)
        {
          string TextureName = BogeyLiveryTextureOptions.GetIndexedTagName(i);
          string TextureMode = BogeyLiveryTextureOptions.GetNamedTag(TextureName);
          if(TextureMode == "none")
          {
            ActiveBogey.SetFXTextureReplacement(TextureName,textureSet,m_copySkinBogey);
            m_copySkinBogey = m_copySkinBogey + 1;
          }
          else if(TextureMode == "diffusenormal")
          {
            ActiveBogey.SetFXTextureReplacement(TextureName + "_diffuse",textureSet,m_copySkinBogey);
            ActiveBogey.SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkinBogey + 1);
            m_copySkinBogey = m_copySkinBogey + 2;
          }
          else if(TextureMode == "pbrstandard")
          {
            ActiveBogey.SetFXTextureReplacement(TextureName + "_albedo",textureSet,m_copySkinBogey);
            ActiveBogey.SetFXTextureReplacement(TextureName + "_normal",textureSet,m_copySkinBogey + 1);
            ActiveBogey.SetFXTextureReplacement(TextureName + "_parameter",textureSet,m_copySkinBogey + 2);
            m_copySkinBogey = m_copySkinBogey + 3;
          }
          else
          {
            TrainzScript.Log("Livery mode " + TextureMode + " is not supported!");
          }
        }
      }
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

    //Couple lock
    if(b_CoupleLockEnabled)
    {
      Uncouple(cast<Vehicle>msg.src);
    }
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
  // Name: ToggleExtraLamp()
  // Desc: Toggles the state of a custom lamp effect
  // ============================================================================
  void ToggleExtraLamp(int TargetLamp)
  {
    ExtraLampVisibility[TargetLamp] = !ExtraLampVisibility[TargetLamp];
    string effectName = ExtraLampsContainer.GetIndexedTagName(TargetLamp);
    if(ExtraLampVisibility[TargetLamp])
      SetFXAttachment(effectName, ExtraLampAssets[TargetLamp]);
    else
      SetFXAttachment(effectName, null);
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

    if (FlagTest(headcode, HEADCODE_NONE)) temp = strTable.GetString("headcode_none");
    if (FlagTest(headcode, HEADCODE_ALL_LAMPS)) temp = strTable.GetString("headcode_all");
    if (FlagTest(headcode, HEADCODE_TAIL_LIGHTS)) temp = strTable.GetString("headcode_tail");
    if (FlagTest(headcode, HEADCODE_BRANCH)) temp = strTable.GetString("headcode_branch");
    if (FlagTest(headcode, HEADCODE_EXPRESS)) temp = strTable.GetString("headcode_express");
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT)) temp = strTable.GetString("headcode_express_f1");
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT_2)) temp = strTable.GetString("headcode_express_f2");
    if (FlagTest(headcode, HEADCODE_EXPRESS_FREIGHT_3)) temp = strTable.GetString("headcode_express_f3");
    if (FlagTest(headcode, HEADCODE_GOODS)) temp = strTable.GetString("headcode_goods");
    if (FlagTest(headcode, HEADCODE_LIGHT)) temp = strTable.GetString("headcode_light");
    if (FlagTest(headcode, HEADCODE_THROUGH_FREIGHT)) temp = strTable.GetString("headcode_thru_freight");
    if (FlagTest(headcode, HEADCODE_TVS)) temp = strTable.GetString("headcode_tvs");
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
      string html = inherited();

      //StringTable strTable = GetAsset().GetStringTable();
      html = html + "<html><body>";
      html = html + "<table cellspacing=2>";

      // debugging
      // Let's post the current Trainz version for debugging purposes.
      html = html + "<tr><td>";
      html = html + strTable.GetString("trainz_ver_debug") + trainzVersion;
      html = html + "</tr></td>";

      //lamp icon
      // // option to change headcode, this displays inside the ? HTML window in surveyor.
      html = html + "<tr><td>";
      html = html + "<a href=live://property/headcode_lamps><img kuid='<kuid:414976:103609>' width=300 height=20></a>";
      html = html + "</tr></td>";
      //lamp status
      string headcodeLampStr = "<a href=live://property/headcode_lamps>" + HeadcodeDescription(m_headCode) + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("headcode_select", headcodeLampStr);
      html = html + "</tr></td>";

      //livery window
      html = html + "<tr><td>";
      html = html + "<a href=live://property/skin><img kuid='<kuid:414976:103610>' width=300 height=20></a>";
      html = html + "</tr></td>";
      //livery status
      string classSkinStr = "<a href=live://property/skin>" + LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(skinSelection)) + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("skin_select", classSkinStr);
      html = html + "</tr></td>";

      //face window
      html = html + "<tr><td>";
      html = html + "<a href=live://property/faces><img kuid='<kuid:414976:105808>' width=300 height=20></a>";
      html = html + "</tr></td>";
      //face status
      string classFaceStr = "<a href=live://property/faces>" + FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(faceSelection)) + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("faces_select", classFaceStr);
      html = html + "</tr></td>";

      return html;
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
      return strTable.GetString("headcode_name");
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
      return strTable.GetString("headcode_description");
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
      for(i = 0; i < LiveryContainer.CountTags(); i++) // Let us loop through the entire possible skins and list them all.
      {
          result[i] = LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(i));
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
      if (p_index > -1 and p_index < LiveryContainer.CountTags())
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
      faceSelection--;
    }
    ConfigureFaces();
  }

  public void HandleKeyFRight(Message msg)
  {
    if (faceSelection < FacesContainer.CountTags() - 1)
    {
      faceSelection++;
    }
    ConfigureFaces();
  }

  //wheeshing, currently disabled
  public void HandleWheesh(Message msg)
  {
    Soup parameters = msg.paramSoup;
    float Intensity = (parameters.GetNamedTagAsFloat("control-value") - 0.5) * 100;
    TrainzScript.Log("Wheesh intensity " + (string)Intensity);
    SetPFXEmitterRate(BoundWheesh, 0, Intensity);
  }

  // ============================================================================
  // Name: EyeScriptCheckThread()
  // Desc: A thread that manages eye movement.
  // ============================================================================

	thread void EyeScriptCheckThread() {
		while(true)
    {
      if(!useLockTarget)
      {
        //Animation setup
        if(eye_isanimating and (eye_animframe <= (eye_anim.size()-1))){ // check if the eye should be currently animating and the animation isnt over
          Orientation eye_Angdeconstruct = eye_anim[eye_animframe];
          eyeX = eye_Angdeconstruct.rx;
          eyeY = eye_Angdeconstruct.ry;
          eyeZ = eye_Angdeconstruct.rz;

          eye_animframe++;

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
      }
      else if(eyeLockTarget != null)
      {
        Orientation lookAng = LookAt(GetMapObjectPosition(), eyeLockTarget.GetMapObjectPosition());
        Orientation finalAng = DeltaRot(GetMapObjectOrientation(), lookAng);
        eyeX = rad_range(finalAng.rz - (Math.PI / 2.0));
        eyeX = clamp(eyeX, -38.0 * (Math.PI / 180.0), 38.0 * (Math.PI / 180.0));

        //eyeY = finalAng.ry - (Math.PI / 4.0);
        //eyeY = lookAng.ry - (Math.PI / 4.0);
        TrainzScript.Log("rot x " + eyeX);
      }

			//final orientation apply ================================================
			SetEyeMeshOrientation(eyeY, eyeZ, eyeX);

			Sleep(eye_UpdatePeriod);
		}
	}

  // ============================================================================
  // Name: EyeTargetChanged()
  // Desc: A handler for left click selection events, used for eye lock targeting.
  // ============================================================================
  void EyeTargetChanged(Message msg)
  {
    eyeLockTarget = msg.src;
    selectingTarget = false;
    World.SetTargetObserver(null);
    RefreshBrowser();
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
          float value = CurrentSmoke.GetNamedTagAsFloat(curTagName);
          int phase = 0;
          TrainzScript.Log("Attempting to set " + curTagName + " to " + (string)value + " for smoke" + (string)i);
          if(curTagName == "rate") SetPFXEmitterRate(i, phase, value);
          if(curTagName == "velocity") SetPFXEmitterVelocity(i, phase, value);
          if(curTagName == "lifetime") SetPFXEmitterLifetime(i, phase, value);
          if(curTagName == "minsize") SetPFXEmitterMinSize(i, phase, value);
          if(curTagName == "maxsize") SetPFXEmitterMaxSize(i, phase, value);

        }
      }
    }
  }

  // ============================================================================
  // Name: RefreshSmokeTags()
  // Desc: Updates all smoke sliders.
  // ============================================================================

  void RefreshSmokeTags()
  {
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
  }

  float Lerp(float from, float to, float t)
	{
		return (from + (to - from)*t);
	}

  thread void ShakeThread()
  {
    int ShakeTime = 0;
    float ShakeTargetX = 0;
    float ShakeTargetY = 0;
    float ShakeTargetZ = 0;
    float LastShakeTargetX = 0;
    float LastShakeTargetY = 0;
    float LastShakeTargetZ = 0;
    while(b_ShakeEnabled)
    {
      if(browser and CurrentMenu == BROWSER_LOCOMENU)
      {
        b_ShakeIntensity = Str.UnpackFloat(browser.GetElementProperty("shakeintensity", "value"));
        b_ShakePeriod = Str.UnpackFloat(browser.GetElementProperty("shakeperiod", "text")); //seconds to tenths
      }

      //prevent divide by zero
      int localPeriod = (b_ShakePeriod * 100.0);
      if(localPeriod < 2) localPeriod = 2;

      float Along = (float)ShakeTime/(float)localPeriod;
      float InterpX = Lerp(LastShakeTargetX, ShakeTargetX, Along);
      float InterpY = Lerp(LastShakeTargetY, ShakeTargetY, Along);
      float InterpZ = Lerp(LastShakeTargetZ, ShakeTargetZ, Along);
      SetMeshOrientation("default", InterpX, InterpY, InterpZ);

      if(ShakeTime == localPeriod)
			{
				ShakeTime = 0;
				LastShakeTargetX = ShakeTargetX;
				LastShakeTargetY = ShakeTargetY;
				LastShakeTargetZ = ShakeTargetZ;
				ShakeTargetX = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
				ShakeTargetY = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
				ShakeTargetZ = Math.Rand(-b_ShakeIntensity, b_ShakeIntensity);
			}

      ShakeTime++;
      Sleep(0.01);
    }
  }



define int Joystick_Size = 75;
define float Joystick_Range = 44.0;
  string GetJoystickContentHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<img kuid='<kuid:414976:104990>' width=" + (string)Joystick_Size + " height=" + (string)Joystick_Size + ">");
    output.Print("</body></html>");

    return output.AsString();
  }
  thread void JoystickThread()
  {
    int BrowserCenterX = browser.GetWindowLeft() + (browser.GetWindowWidth() / 2);
    int BrowserCenterY = browser.GetWindowTop() + (browser.GetWindowHeight() / 2);
    int HalfSize = Joystick_Size / 2;
    Browser Joystick = Constructors.NewBrowser();
    Joystick.SetCloseEnabled(false);
    Joystick.LoadHTMLString(GetAsset(), GetJoystickContentHTML());
    //Joystick.SetWindowStyle(Browser.STYLE_NO_FRAME);
    Joystick.SetWindowStyle(Browser.STYLE_POPOVER);
    Joystick.SetWindowPriority(Browser.BP_Window); //must be called after style
    //Joystick.SetWindowStyle(Browser.STYLE_SLIM_FRAME);
    Joystick.SetMovableByDraggingBackground(true);
  	Joystick.SetWindowPosition(BrowserCenterX - HalfSize, BrowserCenterY - HalfSize);
  	Joystick.SetWindowSize(Joystick_Size, Joystick_Size);
  	Joystick.SetWindowVisible(true);
    while(CurrentMenu == BROWSER_JOYSTICKMENU)
    {
      Joystick.BringToFront();
      int BrowserTop = browser.GetWindowTop();
      int BrowserBottom = browser.GetWindowBottom();
      int BrowserLeft = browser.GetWindowLeft();
      int BrowserRight = browser.GetWindowRight();
      int JoystickTop = Joystick.GetWindowTop();
      int JoystickBottom = Joystick.GetWindowBottom();
      int JoystickLeft = Joystick.GetWindowLeft();
      int JoystickRight = Joystick.GetWindowRight();

      //update center position
      int HalfBrowserWidth = browser.GetWindowWidth() / 2;
      int HalfBrowserHeight = browser.GetWindowHeight() / 2;
      BrowserCenterX = BrowserLeft + HalfBrowserWidth;
      BrowserCenterY = BrowserTop + HalfBrowserHeight;
      //get relative
      int CenterLeft = BrowserCenterX - HalfSize;
      int CenterTop = BrowserCenterY - HalfSize;
      int RelativeX = JoystickLeft - CenterLeft;
      int RelativeY = JoystickTop - CenterTop;

      if(JoystickLeft < BrowserLeft) Joystick.SetWindowPosition(BrowserLeft, JoystickTop);
      if(JoystickTop < BrowserTop) Joystick.SetWindowPosition(JoystickLeft, BrowserTop);
      if(JoystickRight > BrowserRight) Joystick.SetWindowPosition(BrowserRight - Joystick_Size, JoystickTop);
      if(JoystickBottom > BrowserBottom) Joystick.SetWindowPosition(JoystickLeft, BrowserBottom - Joystick_Size);

      float OffsetX = ((float)RelativeX / (float)HalfBrowserWidth);
      float OffsetY = ((float)RelativeY / (float)HalfBrowserWidth); // HalfBrowserHeight different browser dimensions
      //OffsetX = Math.Fmax(Math.Fmin(OffsetX, Joystick_Range), -Joystick_Range);
      //OffsetY = Math.Fmax(Math.Fmin(OffsetY, Joystick_Range), -Joystick_Range);
      //normalize the offset
      float length = Math.Sqrt(OffsetX * OffsetX + OffsetY * OffsetY) + 0.001; //prevent divide by zero
      if(length > 1.0)
      {
        OffsetX = OffsetX / length;
        OffsetY = OffsetY / length;
      }

      eyeX = (OffsetX * Joystick_Range) * Math.PI / 180;
      eyeY = (OffsetY * Joystick_Range) * Math.PI / 180;

      //TrainzScript.Log("Browser offset is " + (string)OffsetX + " " + (string)OffsetY);
      Sleep(0.01);
    }
    //clear when menu exits
    Joystick = null;
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

    if(AssetObsolete)
    {
      output.Print("<a href='live://update'>Out of date! Click here to update.</a>");
      output.Print("<br>");
    }

    output.Print("<table cellspacing=5>");
    //eye window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_eye'><img kuid='<kuid:414976:103313>' width=300 height=20></a>");
    output.Print("</tr></td>");
    //joystick window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_joystick'><img kuid='<kuid:414976:105003>' width=300 height=20></a>");
    output.Print("</tr></td>");
    //lamp window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_lamp'><img kuid='<kuid:414976:103609>' width=300 height=20></a>");
    output.Print("</tr></td>");

    //livery window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_livery'><img kuid='<kuid:414976:103610>' width=300 height=20></a>");
    output.Print("</tr></td>");

    //face window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_face'><img kuid='<kuid:414976:105808>' width=300 height=20></a>");
    output.Print("</tr></td>");

    //loco window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_loco'><img kuid='<kuid:414976:103611>' width=300 height=20></a>");
    output.Print("</tr></td>");

    //smoke window
    output.Print("<tr><td>");
    output.Print("<a href='live://open_smoke'><img kuid='<kuid:414976:103612>' width=300 height=20></a>");
    output.Print("</tr></td>");
    output.Print("</table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }


  string GetEyeWindowHTML()
  {
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
  	output.Print("<table>");

    output.Print("<tr><td>");
    output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("</tr></td>");

    //Options
    output.Print("<tr><td>");
    output.Print("<font><b>" + strTable.GetString("eye_menu") + "</font>");
    output.Print("<br>");
    output.Print("<a href='live://eye-reset' tooltip='" + strTable.GetString("tooltip_reset") + "'><font>" + strTable.GetString("reset_controls") + "</font></a>");
    output.Print("</tr></td>");

    //controls
    output.Print("<tr><td>");
    output.Print(strTable.GetString("eye_rotation_h"));
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeX' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(strTable.GetString("eye_rotation_v"));
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeY' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    //dial is no longer advanced lol
    output.Print("<tr><td>");
    output.Print("<trainz-object style=dial width=100 height=100 id='eyeZ' texture='newdriver/dcc/dcc_controller.tga' min=0.0 max=1.0 valmin=0.0 valmax=360.0 step=0 clickstep=1 value=0.0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print("<a href='live://record'><font>" + strTable.GetString("recording_start") + "</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://record-stop'><font>" + strTable.GetString("recording_stop") + "</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://play'><font>" + strTable.GetString("recording_anim") + "</font></a>");
    output.Print("</tr></td>");

    output.Print("</table>");

    output.Print("<br>");
    output.Print(HTMLWindow.CheckBox("live://eye-lock", useLockTarget));
  	output.Print(strTable.GetString("target_lock") + "</tr></td>");
    if(useLockTarget)
  	{
      string targetText = strTable.GetString("target_select");
      if(selectingTarget)
        targetText = strTable.GetString("target_looking");
      else if(eyeLockTarget != null)
        targetText = eyeLockTarget.GetAsset().GetLocalisedName();
  		output.Print("<br>");
  		output.Print("<a href='live://eye-lock-select' tooltip='" + strTable.GetString("target_select_eye") + "'>" + targetText + "</a>");
  	}

  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetJoystickWindowHTML()
  {
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");

  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetLampWindowHTML()
  {
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
    output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");
    output.Print("<table>");
      output.Print("<tr>");
        output.Print("<td></td>");
        output.Print("<td rowspan=2><img kuid='<kuid:414976:105416>' width=256 height=256></td>");
        //output.Print("<td rowspan=2><img kuid='<kuid:414976:105423>' width=48 height=48></td>");
      output.Print("</tr>");
      output.Print("<tr>");
        //overlay
        output.Print("<td colspan=2>");
          //output.Print("<img kuid='<kuid:414976:105423>' width=48 height=48>");

          //output.Print("<img kuid='<kuid:414976:105416>' width=256 height=256>");
          //upper row
          output.Print("<table>");
            output.Print("<tr height=10></tr>");
            output.Print("<tr height=48>");
              output.Print("<td width='98'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_tc'><img kuid='");
                if ((m_headCode & HEADCODE_TC) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
            output.Print("</tr>");
          output.Print("</table>");
          output.Print("<br>");
          //bottom row
          output.Print("<table>");
            output.Print("<tr height=90></tr>"); //spacing
            output.Print("<tr height=48>");
              output.Print("<td width='32'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_br'><img kuid='");
                if ((m_headCode & HEADCODE_BR) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
              output.Print("<td width='5'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_bc'><img kuid='");
                if ((m_headCode & HEADCODE_BC) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
              output.Print("<td width='5'></td>"); //spacing
              output.Print("<td>");

                output.Print("<a href='live://lamp_bl'><img kuid='");
                if ((m_headCode & HEADCODE_BL) == 0)
                  output.Print("<kuid:414976:105456>");
                else
                  output.Print("<kuid:414976:105423>");
                output.Print("' width=48 height=48></a>");

              output.Print("</td>");
            output.Print("</tr>");
          output.Print("</table>");

        //end overlay
        output.Print("</td>");
      output.Print("</tr>");
    output.Print("</table>");

    if(ExtraLampsContainer)
    {
      output.Print("<br>");
      output.Print("Custom Lamps:");
      output.Print("<br>");
      output.Print("<table>");
      output.Print("<tr> <td width='300'></td> </tr>");
      bool rowParity = false;
      int i;
      for(i = 0; i < ExtraLampsContainer.CountTags(); i++)
      {
        rowParity = !rowParity;
        string effectName = ExtraLampsContainer.GetIndexedTagName(i);
        string nameText = ExtraLampsContainer.GetNamedTag(effectName);
        if (rowParity)
          output.Print("<tr bgcolor=#0E2A35>");
        else
          output.Print("<tr bgcolor=#05171E>");

        output.Print("<td>");
        output.Print(HTMLWindow.CheckBox("live://extra-lamps/" + i, ExtraLampVisibility[i]));
        output.Print(" " + nameText);
        output.Print("</tr></td>");
      }
      output.Print("</table>");
    }
    //output.Print("<nowrap>");
    //output.Print("lamp");
    //output.Print("<img kuid='<kuid:414976:105416>' width=256 height=256>");
    //output.Print("overlay");
    //output.Print("</nowrap>");

  	output.Print("</body></html>");

  	return output.AsString();
  }

  string GetLiveryWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");
    output.Print(strTable.GetString("skin_description"));
    output.Print("<br>");
    output.Print("<table>");
    output.Print("<tr> <td width='300'></td> </tr>");
    bool rowParity = false;
    int i;
    for(i = 0; i < LiveryContainer.CountTags(); i++)
    {
      rowParity = !rowParity;
      string liveryName = LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(i));
      if (rowParity)
        output.Print("<tr bgcolor=#0E2A35>");
      else
        output.Print("<tr bgcolor=#05171E>");

      output.Print("<td>");
      if(i != skinSelection)
        output.Print("<a href='live://livery_set/" + i + "'>");
      output.Print(liveryName);
      if(i != skinSelection)
        output.Print("</a>");

      output.Print("</td>");
      output.Print("</tr>");
    }
    output.Print("</table>");
    output.Print("</body></html>");
    return output.AsString();
  }

  string GetFaceWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");
    output.Print(strTable.GetString("faces_description"));
    output.Print("<br>");
    output.Print("<table>");
    output.Print("<tr> <td width='300'></td> </tr>");
    bool rowParity = false;
    int i;
    for(i = 0; i < FacesContainer.CountTags(); i++)
    {
      rowParity = !rowParity;
      string faceName = FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(i));
      if (rowParity)
        output.Print("<tr bgcolor=#0E2A35>");
      else
        output.Print("<tr bgcolor=#05171E>");

      output.Print("<td>");
      if(i != faceSelection)
        output.Print("<a href='live://face_set/" + i + "'>");
      output.Print(faceName);
      if(i != faceSelection)
        output.Print("</a>");

      output.Print("</td>");
      output.Print("</tr>");
    }
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
    output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-wheelslip", b_WheelslipEnabled));
    output.Print(" " + strTable.GetString("wheelslip"));
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-shake", b_ShakeEnabled));
    output.Print(" " + strTable.GetString("shake"));
    if(b_ShakeEnabled)
    {
      output.Print("<br>");
      output.Print(strTable.GetString("shake_intensity"));
      output.Print("<br>");
      output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=16 id='shakeintensity' min=0.0 max=0.2 value=0.0 page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
      output.Print("<br>");
      output.Print(strTable.GetString("shake_period"));
      output.Print("<trainz-object style=edit-box link-on-focus-loss id=shakeperiod width=60 height=16></trainz-object>");
    }
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(HTMLWindow.CheckBox("live://property/loco-couple", b_CoupleLockEnabled));
    output.Print(" " + strTable.GetString("couple_disable"));
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
    output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("</tr></td>");

    //Generate smoke containers
    int i;
    for(i = 0; i < SmokeEdits.CountTags(); i++)
    {
      Soup CurrentSmoke = SmokeEdits.GetNamedSoup((string)i);
      output.Print("<tr><td>");
      output.Print("<b>");
      output.Print("smoke" + (string)i + " ");
      output.Print("</b>");

      if(CurrentSmoke.GetNamedTagAsBool("expanded")) output.Print("<a href='live://contract/" + (string)i + "'>-</a>");
      else output.Print("<a href='live://expand/" + (string)i + "'>+</a>");

      output.Print("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
      if(i != BoundWheesh)
      {
        output.Print("<i><a href='live://smoke-bind/" + (string)i + "'>" + strTable.GetString("bind_wheesh") + "</a></i>");
      }

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
            output.Print("<a href='live://smoke-update/" + (string)i + curTagName + "'>");
            output.Print("<trainz-object style=slider horizontal theme=standard-slider width=200 height=16 id='" + (string)i + curTagName + "' min=0.0 max=50.0 value=0.0 page-size=0.1 draw-marks=0 draw-lines=0></trainz-object>");
            output.Print("</a>");
            output.Print("<br>");
            output.Print("<trainz-text id='" + (string)i + curTagName + "-text" + "' text='" + (string)CurrentSmoke.GetNamedTagAsFloat(curTagName) + "'></trainz-text>");
            output.Print("<br>");
            output.Print("</tr></td>");
          }
        }
        output.Print("</table>");
      }
      output.Print("</tr></td>");
    }

    //output.Print("<tr><td>");
    //output.Print("<a href='live://smoke-apply'>Apply</a>");
    //output.Print("</tr></td>");

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
      case BROWSER_JOYSTICKMENU:
        browser.LoadHTMLString(GetAsset(), GetJoystickWindowHTML());
        JoystickThread();
        break;
      case BROWSER_LAMPMENU:
        browser.LoadHTMLString(GetAsset(), GetLampWindowHTML());
        break;
      case BROWSER_LIVERYMENU:
        browser.LoadHTMLString(GetAsset(), GetLiveryWindowHTML());
        break;
      case BROWSER_FACEMENU:
        browser.LoadHTMLString(GetAsset(), GetFaceWindowHTML());
        break;
      case BROWSER_LOCOMENU:
        browser.LoadHTMLString(GetAsset(), GetLocoWindowHTML());
        browser.SetElementProperty("shakeintensity", "value", (string)b_ShakeIntensity);
        browser.SetElementProperty("shakeperiod", "text", (string)b_ShakePeriod);
        break;
      case BROWSER_SMOKEMENU:
        browser.LoadHTMLString(GetAsset(), GetSmokeWindowHTML());
        RefreshSmokeTags();
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
        CurrentMenu = BROWSER_MAINMENU;
        browser = null;
        BrowserClosed = true;
      }
      if (HasFocus and BrowserClosed)
      {
        //replace this with keybind
        createMenuWindow();
        BrowserClosed = false;
      }

      //if(LockTargetWindow != null)
      //{
        //LockTargetWindow.SearchTick();
      //}
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
      on "Browser-URL", "live://update", msg:
      if ( browser and msg.src == browser )
      {
        ShowUpdatePrompt();
        AssetObsolete = false;
        RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Eye Window
      on "Browser-URL", "live://open_eye", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_EYEMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Joystick Window
      on "Browser-URL", "live://open_joystick", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_JOYSTICKMENU;
          eyeZ = 0.0; //clear any rotation beforehand
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Lamp Window
      on "Browser-URL", "live://open_lamp", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_LAMPMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Livery Window
      on "Browser-URL", "live://open_livery", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_LIVERYMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      //Face Window
      on "Browser-URL", "live://open_face", msg:
      if ( browser and msg.src == browser )
      {
          CurrentMenu = BROWSER_FACEMENU;
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://lamp_tc", msg:
      if ( browser and msg.src == browser )
      {
          m_headCode = m_headCode ^ HEADCODE_TC;
          ConfigureHeadcodeLamps(m_headCode);
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://lamp_bl", msg:
      if ( browser and msg.src == browser )
      {
          m_headCode = m_headCode ^ HEADCODE_BL;
          ConfigureHeadcodeLamps(m_headCode);
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://lamp_bc", msg:
      if ( browser and msg.src == browser )
      {
          m_headCode = m_headCode ^ HEADCODE_BC;
          ConfigureHeadcodeLamps(m_headCode);
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://lamp_br", msg:
      if ( browser and msg.src == browser )
      {
          m_headCode = m_headCode ^ HEADCODE_BR;
          ConfigureHeadcodeLamps(m_headCode);
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

      on "Browser-URL", "live://property/loco-shake", msg:
      if ( browser and msg.src == browser )
      {
          b_ShakeEnabled = !b_ShakeEnabled;
          if(b_ShakeEnabled)
          {
            ShakeThread();
          }
          else
          {
            SetMeshOrientation("default", 0.0, 0.0, 0.0);
          }
          RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://property/loco-couple", msg:
      if ( browser and msg.src == browser )
      {
          b_CoupleLockEnabled = !b_CoupleLockEnabled;
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

      on "Browser-URL", "live://eye-lock", msg:
      if ( browser and msg.src == browser )
      {
        useLockTarget = !useLockTarget;
        RefreshBrowser();
      }
      msg.src = null;
      continue;

      on "Browser-URL", "live://eye-lock-select", msg:
      if ( browser and msg.src == browser )
      {
        World.SetTargetObserver(me);
        selectingTarget = true;
        RefreshBrowser();
      }
      msg.src = null;
      continue;

      //other messages
      on "Browser-URL", "", msg:
      if ( browser and msg.src == browser )
      {

        if(TrainUtil.HasPrefix(msg.minor, "live://smoke-update/"))
        {
          string command = msg.minor;
          Str.TrimLeft(command, "live://smoke-update/");
          if(command)
          {
            //unpackint removes the integer from the original string
            string[] propertytokens = Str.Tokens(command, "0123456789");
            string propertyname = propertytokens[propertytokens.size() - 1];
            string smokeid = Str.UnpackInt(Str.CloneString(command));
            Soup smoke = SmokeEdits.GetNamedSoup(smokeid);

            float value = Str.ToFloat(browser.GetElementProperty(command, "value"));

            smoke.SetNamedTag(propertyname, value);

            browser.SetTrainzText(command + "-text", (string)value);

            RefreshSmokeTags();
            UpdateSmoke();
          }
        }
        else if(TrainUtil.HasPrefix(msg.minor, "live://contract/"))
        {
          string command = Str.Tokens(msg.minor, "live://contract/")[0];
          if(command)
          {
            Soup smoke = SmokeEdits.GetNamedSoup(command);
            smoke.SetNamedTag("expanded", false);
            RefreshBrowser();
          }
        }
        else if(TrainUtil.HasPrefix(msg.minor, "live://expand/"))
        {
          string command = Str.Tokens(msg.minor, "live://expand/")[0];
          if(command)
          {
            Soup smoke = SmokeEdits.GetNamedSoup(command);
            smoke.SetNamedTag("expanded", true);
            RefreshBrowser();
          }
        }
        else if(TrainUtil.HasPrefix(msg.minor, "live://smoke-bind/"))
        {
          string command = Str.Tokens(msg.minor, "live://smoke-bind/")[0];
          if(command)
          {
             BoundWheesh = Str.UnpackInt(command);
             RefreshBrowser();
          }
        }
        else if(TrainUtil.HasPrefix(msg.minor, "live://extra-lamps/"))
        {
          string command = Str.Tokens(msg.minor, "live://extra-lamps/")[0];
          if(command)
          {
             int TargetLamp = Str.UnpackInt(command);
             ToggleExtraLamp(TargetLamp);
             RefreshBrowser();
          }
        }
        else if(TrainUtil.HasPrefix(msg.minor, "live://livery_set/"))
        {
          string command = Str.Tokens(msg.minor, "live://livery_set/")[0];
          if(command)
          {
             skinSelection = Str.UnpackInt(command);
             ConfigureSkins();
             RefreshBrowser();
          }
        }
        else if(TrainUtil.HasPrefix(msg.minor, "live://face_set/"))
        {
          string command = Str.Tokens(msg.minor, "live://face_set/")[0];
          if(command)
          {
             faceSelection = Str.UnpackInt(command);
             ConfigureFaces();
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

  // ============================================================================
  // Math Utility Functions
  // Desc: Trig functions and stuff.
  // ============================================================================

  public define float PI_2 = 3.14159265/2.0;

  float ApproxAtan(float z)
  {
      float n1 = 0.97239411;
      float n2 = -0.19194795;
      return (n1 + n2 * z * z) * z;
  }

  float ApproxAtan2(float y, float x)
  {
      if (x != 0.0)
      {
          if (Math.Fabs(x) > Math.Fabs(y))
          {
              float z = y / x;
              if (x > 0.0)
              {
                  // atan2(y,x) = atan(y/x) if x > 0
                  return ApproxAtan(z);
              }
              else if (y >= 0.0)
              {
                  // atan2(y,x) = atan(y/x) + PI if x < 0, y >= 0
                  return ApproxAtan(z) + Math.PI;
              }
              else
              {
                  // atan2(y,x) = atan(y/x) - PI if x < 0, y < 0
                  return ApproxAtan(z) - Math.PI;
              }
          }
          else // Use property atan(y/x) = PI/2 - atan(x/y) if |y/x| > 1.
          {
              float z = x / y;
              if (y > 0.0)
              {
                  // atan2(y,x) = PI/2 - atan(x/y) if |y/x| > 1, y > 0
                  return -ApproxAtan(z) + PI_2;
              }
              else
              {
                  // atan2(y,x) = -PI/2 - atan(x/y) if |y/x| > 1, y < 0
                  return -ApproxAtan(z) - PI_2;
              }
          }
      }
      else
      {
          if (y > 0.0) // x = 0, y > 0
          {
              return PI_2;
          }
          else if (y < 0.0) // x = 0, y < 0
          {
              return -PI_2;
          }
      }
      return 0.0; // x,y = 0. Could return NaN instead.
  }
  define int SINETIMEOUT = 512;

  float rad_range(float in_x)
  {
    float x = in_x;
    if(x and x != 0.0)
    {
      int Timeout = 0;
      if (x < -(float)Math.PI)
          while(Timeout < SINETIMEOUT and x < -(float)Math.PI)
          {
            x = x + (float)Math.PI * 2;
            Timeout++;
          }
      if (x > (float)Math.PI)
          while(Timeout < SINETIMEOUT and x > (float)Math.PI)
          {
            x = x - (float)Math.PI * 2;
            Timeout++;
          }
    }
    return x;
  }

  float fast_sin(float in_x)
  {
    float x = in_x;
    //always wrap input angle to -PI..PI
    if(x and x != 0.0)
    {
      int Timeout = 0;
      if (x < -(float)Math.PI)
          while(Timeout < SINETIMEOUT and x < -(float)Math.PI)
          {
            x = x + (float)Math.PI * 2;
            Timeout++;
          }
      if (x > (float)Math.PI)
          while(Timeout < SINETIMEOUT and x > (float)Math.PI)
          {
            x = x - (float)Math.PI * 2;
            Timeout++;
          }
    }

    if (x < 0)
    {
        float sin = (4 / (float)Math.PI) * x + (4 / (float)(Math.PI * Math.PI)) * x * x;

        if (sin < 0)
            return .225 * (sin * -sin - sin) + sin;

        return .225 * (sin * sin - sin) + sin;
    }
    else
    {
        float sin = (4 / (float)Math.PI) * x - (4 / (float)(Math.PI * Math.PI)) * x * x;

        if (sin < 0)
            return .225 * (sin * -sin - sin) + sin;

        return .225 * (sin * sin - sin) + sin;
    }
    return 0.0;
  }

  float fast_cos(float x)
  {
    return fast_sin((Math.PI / 2.0) - x);
  }

  WorldCoordinate RotatePoint(WorldCoordinate point, float rotateangle)
  {
    WorldCoordinate newpoint = new WorldCoordinate();
    float s = fast_sin(rotateangle);
    float c = fast_cos(rotateangle);
    newpoint.x = point.x * c - point.y * s;
    newpoint.y = point.x * s + point.y * c;
    newpoint.z = point.z;
    return newpoint;
  }

  Orientation LookAt(WorldCoordinate A, WorldCoordinate B)
  {
    float d_x = B.x - A.x;
    float d_y = B.y - A.y;
    float d_z = B.z - A.z;
    WorldCoordinate delta = new WorldCoordinate();
    delta.x = d_x;
    delta.y = d_y;
    delta.z = d_z;

    Orientation ang = new Orientation();
    float rot_z = ApproxAtan2(d_y, d_x);
    ang.rz = rot_z- Math.PI; // - Math.PI
    WorldCoordinate relative = RotatePoint(delta, -rot_z);
    ang.ry = ApproxAtan2(relative.z, relative.x);
    return ang;
  }

  Orientation DeltaRot(Orientation From, Orientation To)
  {
    Orientation ang = new Orientation();
    ang.rx = To.rx - From.rx;
    ang.ry = To.ry - From.ry;
    ang.rz = To.rz - From.rz;
    return ang;
  }

  float clamp(float x, float lower, float upper)
  {
    float ret = x;
    if(ret < lower)
      ret = lower;
    else if(ret > upper)
      ret = upper;
    return ret;
  }
};
