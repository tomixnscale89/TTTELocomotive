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
include "tttelib.gs"
include "tttebase.gs"
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

class tttelocomotive isclass Locomotive, TTTEBase
{
   // ****************************************************************************/
  // Define Functions
  // ****************************************************************************/

  int DetermineCarPosition(void);
  void SniffMyTrain(void);
  string HeadcodeDescription(int headcode);
  public void SetProperties(Soup soup);
  public Soup GetProperties(void);
  public string GetDescriptionHTML(void);
  string GetPropertyType(string p_propertyID);
  string GetPropertyName(string p_propertyID);
  string GetPropertyDescription(string p_propertyID);
  public string[] GetPropertyElementList(string p_propertyID);
  void SetPropertyValue(string p_propertyID, string p_value, int p_index);
  void SetLampEffects(MeshObject headlightMeshObject,bool headlighton, bool highbeam_state);
  thread void CheckScriptAssetObsolete();
  thread void CheckDLSAdditionalFaces();

  string assignedFriend;
  int eyeQueueFrame = 0;
  EyeFrame[] eyeQueue;
  thread void OnlineEyeThread();

  thread void EyeScriptCheckThread(void);
  //thread void JoystickThread(void);
  thread void BufferThread();
  void SetEyeMeshOrientation(float x, float y, float z);
  thread void MultiplayerBroadcast(void);
  void createMenuWindow();
  void RefreshMenuBrowser();
  void UpdateInterfacePosition();
  void UpdateInterfacePositionHandler(Message msg);
  thread void BrowserThread();
  thread void TickThread(CustomScriptMenu menu);
  thread void ScanBrowser(void);

  void WhistleMonitor(Message msg);
  thread void HeadlightMonitor();

   // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/
  bool AssetObsolete = false;
  KUID ObsoletedBy;


  Asset coupler_idle, coupler_coupled;											// two options for the coupler
  Asset driver, fireman;	// fireman and driver meshes


  bool m_cameraViewpoint; // Current Camera point
  bool m_cameraTarget; // Is this the camera target?

  bool m_trainzModule;

  float trainzVersion = World.GetTrainzVersion();


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


  //public int CurrentMenu = BROWSER_NONE;
  bool HasFocus = false;
  bool BrowserClosed;
  bool PopupClosed = true;


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
    


    CheckScriptAssetObsolete();
    //CheckDLSAdditionalContent();

    //TrainzScript.Log("searching for ttte settings lib");

    // ****************************************************************************/
    // Grab assets from the Locomotive
    // ****************************************************************************/
    faceSelection = 0; // Since we are assuming the locomotive has a face, let's set it to zero so the default face will appear.
    DLSfaceSelection = -1;

    eyeQueue = new EyeFrame[0];

    BuffersContainer = ExtensionsContainer.GetNamedSoup("buffers");
    if(BuffersContainer.CountTags() > 0)
    {
      SetFeatureSupported(FEATURE_BUFFERS);
      BufferThread();
    }
    FacesContainer = ExtensionsContainer.GetNamedSoup("faces");
    LiveryContainer = ExtensionsContainer.GetNamedSoup("liveries");
    ExtraLampsContainer = ExtensionsContainer.GetNamedSoup("extra-lamps");
    LiveryTextureOptions = ExtensionsContainer.GetNamedSoup("livery-textures");
    BogeyLiveryTextureOptions = ExtensionsContainer.GetNamedSoup("bogey-livery-textures");

    if(FacesContainer.CountTags()) SetFeatureSupported(FEATURE_FACES);
    if(LiveryContainer.CountTags()) SetFeatureSupported(FEATURE_LIVERIES);
    if(HasMesh("eye_l") and HasMesh("eye_r")) SetFeatureSupported(FEATURE_EYES);

    Soup TTTESettings = GetTTTELocomotiveSettings();
    bool RandomizeFaces = TTTESettings.GetNamedSoup("random-faces/").GetNamedTagAsBool("value", false);
    if(RandomizeFaces and FacesContainer.CountTags()) faceSelection = Math.Rand(0, FacesContainer.CountTags());

    //check lamp support, a bit hacky
    Soup MeshTable = myConfig.GetNamedSoup("mesh-table");
    int i;
    for(i = 0; i < MeshTable.CountTags(); i++)
    {
      Soup mesh = MeshTable.GetNamedSoup(MeshTable.GetIndexedTagName(i));
      Soup effects = mesh.GetNamedSoup("effects");
      int j;
      for(j = 0; j < effects.CountTags(); j++)
      {
        string effect = effects.GetIndexedTagName(j);
        if(effect == "lamp_tc") SetHeadcodeSupported(HEADCODE_TC);
        else if (effect == "lamp_bl") SetHeadcodeSupported(HEADCODE_BL);
        else if (effect == "lamp_bc") SetHeadcodeSupported(HEADCODE_BC);
        else if (effect == "lamp_br") SetHeadcodeSupported(HEADCODE_BR);
      }
    }
    if(SupportedHeadcode != 0 or ExtraLampsContainer.CountTags()) SetFeatureSupported(FEATURE_LAMPS);

    //liverytextureoptions defines the texture autofill behavior
    //SUPPORTED OPTIONS: none, diffusenormal, pbrstandard

    //set initial extra lamp states to none
    if(ExtraLampsContainer)
    {
      int TagCount = ExtraLampsContainer.CountTags();
      ExtraLampAssets = new Asset[TagCount];
      ExtraLampVisibility = new bool[TagCount];
      //int i;
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
        SetFeatureSupported(FEATURE_SMOKE);
        Soup curSmoke = myConfig.GetNamedSoup(tagName);

        Soup NewContainer = Constructors.NewSoup();
        NewContainer.SetNamedTag("active", false); //whether to override
        NewContainer.SetNamedTag("expanded", false);
        SetNamedFloatFromExisting(curSmoke, NewContainer, "rate");
        SetNamedFloatFromExisting(curSmoke, NewContainer, "velocity");
        SetNamedFloatFromExisting(curSmoke, NewContainer, "lifetime");
        SetNamedFloatFromExisting(curSmoke, NewContainer, "minsize");
        SetNamedFloatFromExisting(curSmoke, NewContainer, "maxsize");

        //TrainzScript.Log(NewContainer.AsString());
        SmokeEdits.SetNamedSoup((string)ParticleCount, NewContainer);
        ParticleCount++;
      }
    }

    //Setup menus after all features are setup
    SetupMenus();

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
    AddHandler(me, "Interface", "LayoutChanged", "UpdateInterfacePositionHandler");

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
    AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");

    // ACS callback handler
    AddHandler(me, "ACScallback", "", "ACShandler");

    // headcode / reporting number handler

    // handler necessary for tail lights
    AddHandler(me, "Train", "Turnaround", "TrainTurnaroundHandler");

    // Handler for Secondary Whistle PFX
    // AddHandler(me.GetMyTrain(), "Train", "NotifyHorn", "WhistleMonitor");

    //listen for user change messages in the online group
    //although this message is sent to OnlineGroup objects, it is forwarded to the online group library through Sniff
    if(GetOnlineLibrary())
    {
      AddHandler(GetOnlineLibrary(), "TTTEOnline", "UsersChange", "UsersChangeHandler");
      AddHandler(GetOnlineLibrary(), "TTTEOnline", "Update", "OnlineUpdateHandler");
      OnlineEyeThread();
    }

    train = me.GetMyTrain(); // Get the train
    SniffMyTrain(); // Then sniff it

    HeadlightMonitor();

  }

  public void ModuleInitHandler(Message msg)
  {
    //regenerate browser
    BrowserClosed = true;
  }

  // ============================================================================
  // Name: IsTargetLoco()
  // Desc: Checks if this locomotive is the target.
  // ============================================================================
  bool IsTargetLoco()
  {
    return GetMyTrain() == World.GetCurrentTrain();
  }

  void UsersChangeHandler(Message msg)
  {
    RefreshBrowser();
  }

  void OnlineUpdateHandler(Message msg)
  {
    Soup parameters = msg.paramSoup;
    string user = parameters.GetNamedTag("username");
    Str.ToLower(user);
    string friendLower = Str.CloneString(assignedFriend);
    Str.ToLower(friendLower);

    if(user == friendLower)
    {
      EyeFrame[] eyeQueueTemp = new EyeFrame[0];
      //eyeQueue

      int newSelection = parameters.GetNamedTagAsInt("faceSelection", faceSelection);
      if(newSelection != faceSelection)
      {
        faceSelection = newSelection;
        if(faceSelection >= FacesContainer.CountTags())
          faceSelection = FacesContainer.CountTags() - 1;
        ConfigureFaces();
      }

      float dccValue = parameters.GetNamedTagAsFloat("dccValue", 0.0);
      GetMyTrain().SetDCCThrottle(dccValue);

      int packetSize = parameters.GetNamedTagAsInt("packetSize", 50);
      int i;
      for(i = 0; i < packetSize; i++)
      {
        Soup frameSoup = parameters.GetNamedSoup((string)i);
        EyeFrame frame = new EyeFrame();
        frame.x = frameSoup.GetNamedTagAsFloat("eyeX");
        frame.y = frameSoup.GetNamedTagAsFloat("eyeY");
        eyeQueueTemp[eyeQueueTemp.size()] = frame;
      }
      //eyeX = parameters.GetNamedTagAsFloat("eyeX");
      //eyeY = parameters.GetNamedTagAsFloat("eyeY");

      //decide whether to append or replace
      int dist = eyeQueue.size() - eyeQueueFrame;

      //if we get more than 30 frames behind, replace
      if(dist > 30)
      {
        eyeQueueFrame = 0;
        eyeQueue = eyeQueueTemp;
      }
      else
      {
        for(i = 0; i < eyeQueueTemp.size(); i++)
          eyeQueue[eyeQueue.size()] = eyeQueueTemp[i];
      }
    }
  }

  thread void OnlineEyeThread()
  {
    while(true)
    {
      if(eyeQueue.size() and eyeQueueFrame < eyeQueue.size())
      {
        EyeFrame frame = eyeQueue[eyeQueueFrame];
        eyeX = frame.x;
        eyeY = frame.y;
        eyeQueueFrame++;
      }

      Sleep(TTTEOnline.RECORD_INTERVAL);
    }
  }

  Soup GetOnlineDesc()
  {
    Soup soup = Constructors.NewSoup();
    soup.SetNamedTag("type", "locoDesc");
    soup.SetNamedTag("targetUser", assignedFriend);

    //config soups are locked
    Soup facesSoup = Constructors.NewSoup();
    facesSoup.Copy(FacesContainer);

    soup.SetNamedSoup("facesContainer", facesSoup);

    return soup;
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
  // Name: ValidateDLSAccess()
  // Desc: Checks that the Download Station is accessible.
  // ============================================================================
  void ValidateDLSAccess()
  {
    int Access = TrainzScript.QueryDownloadStationAccess();
    if(Access == TrainzScript.DLS_ACCESS_VALID)
    {
      TrainzScript.Log("DLS access valid.");
      return;
    }
    if(Access == TrainzScript.DLS_ACCESS_QUERYING)
    {
      TrainzScript.Log("Unable to query Download Station. Retrying...");
      Sleep(1.0);
      ValidateDLSAccess();
    }
    else
    {
      TrainzScript.Log("Unable to access DLS! Error code: " + (string)Access);
      return;
    }
  }

  // ============================================================================
  // Name: IsScriptAssetObsolete()
  // Desc: Checks if TTTELocomotive has an update available on the Download Station.
  // ============================================================================
  thread void CheckScriptAssetObsolete()
  {
    ValidateDLSAccess();
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
    int ErrorCode = search.GetSearchErrorCode();
    if(ErrorCode > 0) TrainzScript.Log("DLS update query failed with code " + (string)ErrorCode);
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

    if(browser)
    {
      RefreshBrowser();
      RefreshMenuBrowser();
    }
    //Asset[] assets = TrainzAssetSearch.SearchAssetsSorted(types, vals, TrainzAssetSearch.SORT_NAME, true);
  }

  // ============================================================================
  // Name: CheckDLSAdditionalFaces()
  // Desc: Checks for custom community liveries or skins available on the Download Station.
  // ============================================================================
  thread void CheckDLSAdditionalFaces()
  {
    ValidateDLSAccess();
    TrainzScript.Log("Checking for content...");
    string NameCategory = ExtensionsContainer.GetNamedTag("name-category");

    int[] types = new int[4];
    string[] vals = new string[4];
    types[0] = TrainzAssetSearch.FILTER_LOCATION;  vals[0] = "dls";
    types[1] = TrainzAssetSearch.FILTER_OBSOLETE;  vals[1] = "false";
    //types[2] = TrainzAssetSearch.FILTER_VALID;     vals[2] = "true";
    //types[2] = TrainzAssetSearch.FILTER_KUID;     vals[2] = "<kuid2:217537:94:2>";
    types[2] = TrainzAssetSearch.FILTER_KEYWORD;  vals[2] = "TTTE";
    //types[2] = TrainzAssetSearch.FILTER_CATEGORY;  vals[2] = "#TTTEFACE";
    types[3] = TrainzAssetSearch.FILTER_CATEGORY;  vals[3] = "CMP;MESH";

    //types[0] = TrainzAssetSearch.FILTER_IN_ASSET_GROUP;  vals[0] = FaceCategory.GetHTMLString();

    AsyncTrainzAssetSearchObject search = TrainzAssetSearch.NewAsyncSearchObject();
    TrainzAssetSearch.AsyncSearchAssetsSorted(types, vals, TrainzAssetSearch.SORT_NAME, true, search);
    search.SynchronouslyWaitForResults();
    int ErrorCode = search.GetSearchErrorCode();
    if(ErrorCode > 0) TrainzScript.Log("DLS query failed with code " + (string)ErrorCode);
    Asset[] DLSAssets = search.GetResults();
    search = null;

    vals[0] = "local";

    search = TrainzAssetSearch.NewAsyncSearchObject();
    TrainzAssetSearch.AsyncSearchAssetsSorted(types, vals, TrainzAssetSearch.SORT_NAME, true, search);
    search.SynchronouslyWaitForResults();
    ErrorCode = search.GetSearchErrorCode();
    if(ErrorCode > 0) TrainzScript.Log("Local query failed with code " + (string)ErrorCode);
    Asset[] LocalAssets = search.GetResults();

    //TrainzScript.Log("found " + (string)results.size() + " results");
    TrainzScript.Log(LocalAssets.size() + " local, " + DLSAssets.size() + " DLS");
    DLSFaces = new Asset[0];
    InstalledDLSFaces = new Asset[0];

    int i;
    for(i = 0; i < LocalAssets.size(); i++)
    {
      Asset FoundAsset = LocalAssets[i];
      string category = FoundAsset.GetCategoryClass();
      string[] categories = Str.Tokens(category, ";");

      if(TrainUtil.AlreadyThereStr(categories, "#TTTEFACE"))
      {
        TrainzScript.Log("Found locally installed face " + FoundAsset.GetLocalisedName());
        if(categories.size() == 3 or (NameCategory and NameCategory != "" and TrainUtil.AlreadyThereStr(categories, NameCategory)))
        {
          AsyncQueryHelper query = FoundAsset.CacheConfigSoup();
          query.SynchronouslyWaitForResults();
          InstalledDLSFaces[InstalledDLSFaces.size()] = FoundAsset;
        }
      }
      if(i % 100 == 0) Sleep(0.001); //prevent timeout
    }

    for(i = 0; i < DLSAssets.size(); i++)
    {
      Asset FoundAsset = DLSAssets[i];
      string category = FoundAsset.GetCategoryClass();
      string[] categories = Str.Tokens(category, ";");

      if(TrainUtil.AlreadyThereStr(categories, "#TTTEFACE") or TrainUtil.HasPrefix(FoundAsset.GetLocalisedName(), "Thomas Face - "))
      {
        TrainzScript.Log("Found DLS face " + FoundAsset.GetLocalisedName());
        if(categories.size() == 3 or (NameCategory and NameCategory != "" and TrainUtil.AlreadyThereStr(categories, NameCategory)))
          DLSFaces[DLSFaces.size()] = FoundAsset;
      }

      if(i % 100 == 0) Sleep(0.001); //prevent timeout
    }

    TrainzScript.Log("Content iteration finished, " + (string)InstalledDLSFaces.size() + " local and " + (string)DLSFaces.size() + " DLS");

    //for(i = 0; i < results.size(); i++)
    //{
      //Asset FoundAsset = results[i];
      //KUID FoundKUID = FoundAsset.GetKUID();

      //GetDependencyList(void) contains?
      //string category = FoundAsset.GetCategoryClass();
      //string[] categories = Str.Tokens(category, ";");

      //if(categories.size() == 3 or //CMP;MESH;#TTTEFACE
        //(NameCategory and NameCategory != "" and TrainUtil.AlreadyThereStr(categories, NameCategory)) //name-category
        //)
      //{
        //TrainzScript.Log("Found face asset " + FoundAsset.GetLocalisedName() + " " + FoundKUID.GetHTMLString() + " installed: " + (string)FoundAsset.IsLocal());
        //add the face
        //if(FoundAsset.IsLocal())
        //{
          //AsyncQueryHelper query = FoundAsset.CacheConfigSoup();
          //query.SynchronouslyWaitForResults();
          //InstalledDLSFaces[InstalledDLSFaces.size()] = FoundAsset;
        //}
        //else
          //DLSFaces[DLSFaces.size()] = FoundAsset;
      //}
      //if(i % 100 == 0) Sleep(0.01); //prevent timeout
    //}

    if(browser) RefreshBrowser();
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
        if(FrontCoupler)
          FrontCoupler.DecoupleFrom(OppositeCoupler);
      }
      else if(direction == "back")
      {
        if(BackCoupler)
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
  // Name: HeadcodeDescription()
  // Desc: Returns the description (aka name) of the headcode selected.
  // We use this instead of placing it inside the traincar config to save extra
  // Data the user has to put in their own creations. Plus, this will never change
  // so there is no reason for the user to specify what headcodes to use.
  // ============================================================================

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
      DLSfaceSelection = -1;
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

      soup.SetNamedTag("is_TTTELocomotive", true);

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
      html = html + "<a href=live://property/headcode_lamps><img kuid='<kuid:414976:103609>' width=32 height=32></a>";
      html = html + "</tr></td>";
      //lamp status
      string headcodeLampStr = "<a href=live://property/headcode_lamps>" + HeadcodeDescription(m_headCode) + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("headcode_select", headcodeLampStr);
      html = html + "</tr></td>";

      //livery window
      html = html + "<tr><td>";
      html = html + "<a href=live://property/skin><img kuid='<kuid:414976:103610>' width=32 height=32></a>";
      html = html + "</tr></td>";
      
      //livery status
      string classSkinStr = "<a href=live://property/skin>" + LiveryContainer.GetNamedTag(LiveryContainer.GetIndexedTagName(skinSelection)) + "</a>";
      html = html + "<tr><td>";
      html = html + strTable.GetString1("skin_select", classSkinStr);
      html = html + "</tr></td>";

      //face window
      html = html + "<tr><td>";
      html = html + "<a href=live://property/faces><img kuid='<kuid:414976:105808>' width=32 height=32></a>";
      html = html + "</tr></td>";

      //face status
      string FaceStr = "";
      if(faceSelection > -1)
        FaceStr = FacesContainer.GetNamedTag(FacesContainer.GetIndexedTagName(faceSelection));
      else if(DLSfaceSelection > -1)
      {
        Asset DLSFace = InstalledDLSFaces[DLSfaceSelection];
        StringTable FaceStrTable = DLSFace.GetStringTable();
        FaceStr = FaceStrTable.GetString("displayname");
        if(!FaceStr or FaceStr == "")
          FaceStr = DLSFace.GetLocalisedName();
      }

      string classFaceStr = "<a href=live://property/faces>" + FaceStr + "</a>";
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
        ConfigureHeadcodeLamps();
      }
    }
    else if (p_propertyID == "faces")
    {
      if (p_index > -1 and p_index < FacesContainer.CountTags())
      {
        faceSelection = p_index;
        DLSfaceSelection = -1;
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
    if(HasFocus or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
    {
      Soup parameters = msg.paramSoup;
      eyeX = (parameters.GetNamedTagAsFloat("control-value") - 0.5) * 1.2;
      SetEyeMeshOrientation(eyeY, eyeZ, eyeX);
    }
  }

  public void HandleYAxis(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    if(HasFocus or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
    {
      Soup parameters = msg.paramSoup;
      eyeY = -(parameters.GetNamedTagAsFloat("control-value") - 0.5) * 1.2;
      SetEyeMeshOrientation(eyeY, eyeZ, eyeX);
    }
  }

  //Face handling
  public void HandleKeyFLeft(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    if(HasFocus or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
    {
      if (faceSelection > 0)
      {
        faceSelection--;
      }
      ConfigureFaces();
    }
  }

  public void HandleKeyFRight(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    if(HasFocus or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
    {
      if (faceSelection < FacesContainer.CountTags() - 1)
      {
        faceSelection++;
      }
      ConfigureFaces();
    }
  }

  public void HandleWheesh(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    if(HasFocus or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
    {
      Soup parameters = msg.paramSoup;
      float Intensity = (parameters.GetNamedTagAsFloat("control-value") - 0.5) * 100;
      TrainzScript.Log("Wheesh intensity " + (string)Intensity);
      SetPFXEmitterRate(BoundWheesh, 0, Intensity);
    }
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
        if (EyescriptMenu != null and CurrentMenu == EyescriptMenu and !BrowserClosed and browser)
        {
          eyeX = Str.ToFloat(popup.GetElementProperty("eyeX", "value")) * Math.PI / 180;
          eyeY = Str.ToFloat(popup.GetElementProperty("eyeY", "value")) * Math.PI / 180;
          eyeZ = Str.ToFloat(popup.GetElementProperty("eyeZ", "value")) * Math.PI / 180;
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
        //TrainzScript.Log("rot x " + eyeX);
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
        DLSfaceSelection = -1;
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
        ConfigureHeadcodeLamps();
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
          popup.SetElementProperty(id, "value", (string)CurrentSmoke.GetNamedTagAsFloat(curTagName));
        }
      }
    }
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

    output.Print("<table cellspacing=2>");

    int icon_scale = 32;

    if(AssetObsolete)
    {
      //output.Print("<a href='live://update'>Out of date! Click here to update.</a>");
      //output.Print("<br>");
      output.Print("<tr><td>");
      output.Print("<a href='live://update'><img kuid='<kuid:414976:101435>' width=" + icon_scale + " height=" + icon_scale + "></a>");
      output.Print("</tr></td>");
    }

    // //eye window
    // if(GetFeatureSupported(FEATURE_EYES))
    // {
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://open_eye'><img kuid='<kuid:414976:103313>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    //   //joystick window
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://open_joystick'><img kuid='<kuid:414976:105003>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    // }

    // //lamp window
    // if(GetFeatureSupported(FEATURE_LAMPS))
    // {
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://open_lamp'><img kuid='<kuid:414976:103609>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    // }

    // //livery window
    // if(GetFeatureSupported(FEATURE_LIVERIES))
    // {
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://open_livery'><img kuid='<kuid:414976:103610>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    // }

    // //face window
    // if(GetFeatureSupported(FEATURE_FACES))
    // {
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://open_face'><img kuid='<kuid:414976:105808>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    // }

    // //loco window
    // output.Print("<tr><td>");
    // output.Print("<a href='live://open_loco'><img kuid='<kuid:414976:103611>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    // output.Print("</tr></td>");

    // //smoke window
    // if(GetFeatureSupported(FEATURE_SMOKE))
    // {
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://open_smoke'><img kuid='<kuid:414976:103612>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    // }

    // if(GetOnlineLibrary())
    // {
    //   output.Print("<tr><td>");
    //   output.Print("<a href='live://open_social'><img kuid='<kuid:414976:102857>' width=" + icon_scale + " height=" + icon_scale + "></a>");
    //   output.Print("</tr></td>");
    // }

    int i;
    for(i = 0; i < customMenus.size(); i++)
    {
      output.Print("<tr><td>");
      output.Print("<a href='live://open_custom/" + (string)i + "'><img kuid='" + customMenus[i].GetIconKUIDString() + "' width=" + icon_scale + " height=" + icon_scale + "></a>");
      output.Print("</tr></td>");
    }

    output.Print("</table>");
  	output.Print("</body></html>");

  	return output.AsString();
  }


  // string GetEyeWindowHTML()
  // {
  // 	HTMLBuffer output = HTMLBufferStatic.Construct();
  // 	output.Print("<html><body>");
  // 	output.Print("<table>");

  //   //output.Print("<tr><td>");
  //   //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
  //   //output.Print("</tr></td>");

  //   //Options
  //   output.Print("<tr><td>");
  //   output.Print("<font><b>" + strTable.GetString("eye_menu") + "</font>");
  //   output.Print("<br>");
  //   output.Print("<a href='live://eye-reset' tooltip='" + strTable.GetString("tooltip_reset") + "'><font>" + strTable.GetString("reset_controls") + "</font></a>");
  //   output.Print("</tr></td>");

  //   //controls
  //   output.Print("<tr><td>");
  //   output.Print(strTable.GetString("eye_rotation_h"));
  //   output.Print("<br>");
  //   output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeX' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
  //   output.Print("</tr></td>");

  //   output.Print("<tr><td>");
  //   output.Print(strTable.GetString("eye_rotation_v"));
  //   output.Print("<br>");
  //   output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeY' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
  //   output.Print("</tr></td>");

  //   //dial is no longer advanced lol
  //   output.Print("<tr><td>");
  //   output.Print("<trainz-object style=dial width=100 height=100 id='eyeZ' texture='newdriver/dcc/dcc_controller.tga' min=0.0 max=1.0 valmin=0.0 valmax=360.0 step=0 clickstep=1 value=0.0></trainz-object>");
  //   output.Print("</tr></td>");

  //   output.Print("<tr><td>");
  //   output.Print("<a href='live://record'><font>" + strTable.GetString("recording_start") + "</font></a>");
  //   output.Print("<br>");
  //   output.Print("<a href='live://record-stop'><font>" + strTable.GetString("recording_stop") + "</font></a>");
  //   output.Print("<br>");
  //   output.Print("<a href='live://play'><font>" + strTable.GetString("recording_anim") + "</font></a>");
  //   output.Print("</tr></td>");

  //   output.Print("</table>");

  //   output.Print("<br>");
  //   output.Print(HTMLWindow.CheckBox("live://eye-lock", useLockTarget));
  // 	output.Print(strTable.GetString("target_lock") + "</tr></td>");
  //   if(useLockTarget)
  // 	{
  //     string targetText = strTable.GetString("target_select");
  //     if(selectingTarget)
  //       targetText = strTable.GetString("target_looking");
  //     else if(eyeLockTarget != null)
  //       targetText = eyeLockTarget.GetAsset().GetLocalisedName();
  // 		output.Print("<br>");
  // 		output.Print("<a href='live://eye-lock-select' tooltip='" + strTable.GetString("target_select_eye") + "'>" + targetText + "</a>");
  // 	}

  // 	output.Print("</body></html>");

  // 	return output.AsString();
  // }

  string GetSmokeWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<table>");

    //output.Print("<tr><td>");
    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    //output.Print("</tr></td>");

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

  string GetStatusString(int status)
  {
    switch(status)
    {
      case OnlineGroup.USER_STATUS_UNKNOWN:
        return "Unknown";
      case OnlineGroup.USER_STATUS_OFFLINE:
        return "Offline";
      case OnlineGroup.USER_STATUS_ONLINE:
        return "Online";
      case OnlineGroup.USER_STATUS_INSIDE:
        return "Active";
      case OnlineGroup.USER_STATUS_INVALID:
        return "Invalid";
      default:
        return "Error";
    }

    return "Error";
  }

  string GetSocialWindowHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("Invite your friends to control this locomotive!");
    output.Print("<br>");

    OnlineGroup socialGroup = GetSocialGroup();

    output.Print("<table width=300>");
    bool rowParity = false;

    int i;
    for(i = 0; i < socialGroup.CountUsers(); i++)
    {
      string user = socialGroup.GetIndexedUser(i);
      int status = socialGroup.GetUserStatus(i);

      rowParity = !rowParity;
      if (rowParity)
        output.Print("<tr bgcolor=#0E2A35 height=20>");
      else
        output.Print("<tr bgcolor=#05171E height=20>");

      output.Print("<td width=100>");
      output.Print(user);
      output.Print("</td>");

      output.Print("<td width=100>");
      if(status == OnlineGroup.USER_STATUS_INSIDE)
      {
        if(user == assignedFriend)
          output.Print("<a href='live://unassign_friend/" + (string)i + "'>Revoke Control</a>");
        else
          output.Print("<a href='live://assign_friend/" + (string)i + "'>Assign To Loco</a>");
      }
      output.Print("</td>");

      output.Print("<td width=50><a href='live://kick_friend/" + (string)i + "'>Kick</a></td>");
      
      output.Print("<td width=50>" + GetStatusString(status) + "</td>");

      output.Print("</tr>");
    }
    output.Print("</table>");

    output.Print("<br>");
    output.Print("iTrainz Username: ");
    output.Print("<trainz-object style=edit-box link-on-focus-loss id=social_user width=250 height=16></trainz-object>");
    output.Print("<br>");

    output.Print("<a href='live://invite_friend'>Invite</a>");
    output.Print("<br>");

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
    browser.SetCloseEnabled(false);
  	//browser.SetWindowPosition(Interface.GetDisplayWidth()-450, Interface.GetDisplayHeight() - 625);
  	browser.SetWindowSize(BROWSER_WIDTH, 400);
    browser.SetWindowStyle(Browser.STYLE_NO_FRAME);
    browser.SetMovableByDraggingBackground(false);
  	browser.SetWindowVisible(true);
  	browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    browser.ResizeHeightToFit();
    BrowserClosed = false;

    if(!PopupClosed)
      createPopupWindow();

    UpdateInterfacePosition();
  }

  // ============================================================================
  // Name: UpdateInterfacePosition()
  // Desc: Updates the position of all UI elements
  // ============================================================================

  void UpdateInterfacePosition()
  {
    int browserLeftOffset = (GetTTTETrainSize() - GetTTTETrainIndex() - 1) * (BROWSER_WIDTH + BROWSER_TRAIN_MARGIN);

    int surveyorOffset = 0;
    if(World.GetCurrentModule() == World.SURVEYOR_MODULE)
      surveyorOffset = SURVEYOR_MENU_OFFSET;

    if(browser) browser.SetWindowPosition(Interface.GetDisplayWidth() - BROWSER_WIDTH - browserLeftOffset, (Interface.GetDisplayHeight() / 2) - (browser.GetWindowHeight() / 2) + surveyorOffset);
  }

  void UpdateInterfacePositionHandler(Message msg)
  {
    UpdateInterfacePosition();
  }

  void RefreshMenuBrowser()
  {
    browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    browser.ResizeHeightToFit();
  }

  // ============================================================================
  // Name: BrowserThread()
  // Desc: Recreates the browser if it is closed. (should be swapped for a module change handler)
  // ============================================================================

  thread void BrowserThread()
  {
    while(true)
    {
      if (!(HasFocus or IsTargetLoco()))
      {
        CurrentMenu = null;
        browser = null;
        popup = null;
        BrowserClosed = true;
      }
      if ((HasFocus or IsTargetLoco()) and BrowserClosed)
      {
        //replace this with keybind
        createMenuWindow();
        BrowserClosed = false;
      }

      //if(LockTargetWindow != null)
      //{
        //LockTargetWindow.SearchTick();
      //}

      UpdateInterfacePosition();

      Sleep(0.1);
    }
  }

  // ============================================================================
  // Name: TickThread()
  // Desc: Ticks the current menu
  // ============================================================================

  thread void TickThread(CustomScriptMenu menu)
  {
    if(menu._tick_running)
      return;
    menu._tick_running = true;

    while(CurrentMenu == menu or (menu.AlwaysTick() and menu._tick_running))
    {
      if(menu and menu.GetTickInterval() > 0.0 and menu._tick_running)
      {
        menu.Tick();
        Sleep(menu.GetTickInterval());
      }
      else
        Sleep(0.1);
    }

    //tell the menu to close
    menu.Close();

    menu._tick_running = false;
  }

  // ============================================================================
  // Name: ScanBrowser()
  // Desc: Handles all browser input.
  // ============================================================================

  thread void ScanBrowser()
  {
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

      // //Eye Window
      // on "Browser-URL", "live://open_eye", msg:
      // if ( browser and msg.src == browser )
      // {
      //     if(CurrentMenu != BROWSER_EYEMENU)
      //     {
      //       CurrentMenu = BROWSER_EYEMENU;
      //       createPopupWindow();
      //       RefreshBrowser();
      //     }
      //     else
      //       closePopup();
      // }
      // msg.src = null;
      // continue;

      // //Joystick Window
      // on "Browser-URL", "live://open_joystick", msg:
      // if ( browser and msg.src == browser )
      // {
      //   if(CurrentMenu != BROWSER_JOYSTICKMENU)
      //   {
      //     CurrentMenu = BROWSER_JOYSTICKMENU;
      //     eyeZ = 0.0; //clear any rotation beforehand
      //     createPopupWindow();
      //     RefreshBrowser();
      //   }
      //   else
      //     closePopup();
      // }
      // msg.src = null;
      // continue;

      // //Lamp Window
      // on "Browser-URL", "live://open_lamp", msg:
      // if ( browser and msg.src == browser )
      // {
      //   if(CurrentMenu != BROWSER_LAMPMENU)
      //   {
      //     CurrentMenu = BROWSER_LAMPMENU;
      //     createPopupWindow();
      //     RefreshBrowser();
      //   }
      //   else
      //     closePopup();
      // }
      // msg.src = null;
      // continue;

      // //Livery Window
      // on "Browser-URL", "live://open_livery", msg:
      // if ( browser and msg.src == browser )
      // {
      //   if(CurrentMenu != BROWSER_LIVERYMENU)
      //   {
      //     CurrentMenu = BROWSER_LIVERYMENU;
      //     createPopupWindow();
      //     RefreshBrowser();
      //   }
      //   else
      //     closePopup();
      // }
      // msg.src = null;
      // continue;

      // //Face Window
      // on "Browser-URL", "live://open_face", msg:
      // if ( browser and msg.src == browser )
      // {
      //   if(CurrentMenu != BROWSER_FACEMENU)
      //   {
      //     CurrentMenu = BROWSER_FACEMENU;
      //     createPopupWindow();
      //     RefreshBrowser();

      //     CheckDLSAdditionalFaces();
      //   }
      //   else
      //     closePopup();
      // }
      // msg.src = null;
      // continue;

      // //Loco Window
      // on "Browser-URL", "live://open_loco", msg:
      // if ( browser and msg.src == browser )
      // {
      //   if(CurrentMenu != BROWSER_LOCOMENU)
      //   {
      //     CurrentMenu = BROWSER_LOCOMENU;
      //     createPopupWindow();
      //     RefreshBrowser();
      //   }
      //   else
      //     closePopup();
      // }
      // msg.src = null;
      // continue;

      // //Smoke Window
      // on "Browser-URL", "live://open_smoke", msg:
      // if ( browser and msg.src == browser )
      // {
      //   if(CurrentMenu != BROWSER_SMOKEMENU)
      //   {
      //     CurrentMenu = BROWSER_SMOKEMENU;
      //     createPopupWindow();
      //     RefreshBrowser();
      //   }
      //   else
      //     closePopup();
      // }
      // msg.src = null;
      // continue;

      // //Social Window
      // on "Browser-URL", "live://open_social", msg:
      // if ( browser and msg.src == browser )
      // {
      //   if(CurrentMenu != BROWSER_SOCIALMENU)
      //   {
      //     CurrentMenu = BROWSER_SOCIALMENU;
      //     createPopupWindow();
      //     RefreshBrowser();
      //   }
      //   else
      //     closePopup();
      // }
      // msg.src = null;
      // continue;

      //invite_friend
      on "Browser-URL", "live://invite_friend", msg:
      if ( popup and msg.src == popup )
      {
        string inviteUser = popup.GetElementProperty("social_user", "text");
        TrainzScript.Log("sending invite to " + inviteUser);

        //assignedFriend = inviteUser;
        
        TTTEOnline onlineLibrary = GetOnlineLibrary();
        if(onlineLibrary and inviteUser != "")
          onlineLibrary.InviteToGroup(inviteUser);
        else
        {
          if(inviteUser == "")
            Interface.ShowMessageBox(me, "Invalid username specified.", true, "TTTEOnline", "invalidUser");
          else
            Interface.ShowMessageBox(me, "Unable to access online library.", true, "TTTEOnline", "invalidLibrary");
        }
        RefreshBrowser();
      }
      msg.src = null;
      continue;


      //Main Window
      on "Browser-URL", "live://return", msg:
      if ( popup and msg.src == popup )
      {
          //CurrentMenu = BROWSER_NONE;
          //RefreshBrowser();
          closePopup();
      }
      msg.src = null;
      continue;

      //other messages
      on "Browser-URL", "", msg:
      {
        //doesn't require the source to be the popup
        if ( (popup and msg.src == popup) or (browser and msg.src == browser) )
        {
          if(TrainUtil.HasPrefix(msg.minor, "live://open_custom/"))
          {
            TrainzScript.Log("Opening custom menu.");
            string command = Str.Tokens(msg.minor, "live://open_custom/")[0];
            if(command)
            {
              int menuID = Str.UnpackInt(command);
              //CustomScriptMenu menu = customMenus[menuID];
              if(CurrentMenu != customMenus[menuID])
              {
                CurrentMenu = customMenus[menuID];
                createPopupWindow();
                RefreshBrowser();
                CurrentMenu.Open();
                TickThread(CurrentMenu);
              }
              else
                closePopup();
            }
          }
        }

        if ( popup and msg.src == popup )
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

              float value = Str.ToFloat(popup.GetElementProperty(command, "value"));

              smoke.SetNamedTag(propertyname, value);

              popup.SetTrainzText(command + "-text", (string)value);

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
          else if(TrainUtil.HasPrefix(msg.minor, "live://assign_friend/"))
          {
            string command = Str.Tokens(msg.minor, "live://assign_friend/")[0];
            if(command)
            {
              int idx = Str.ToInt(command);

              OnlineGroup socialGroup = GetSocialGroup();
              string user = socialGroup.GetIndexedUser(idx);
              
              assignedFriend = user;
              socialGroup.PostMessage(GetOnlineDesc());
              
              RefreshBrowser();
            }
          }
          else if(TrainUtil.HasPrefix(msg.minor, "live://kick_friend/"))
          {
            string command = Str.Tokens(msg.minor, "live://kick_friend/")[0];
            if(command)
            {
              int idx = Str.ToInt(command);

              OnlineGroup socialGroup = GetSocialGroup();
              string user = socialGroup.GetIndexedUser(idx);

              if(user != "")
                socialGroup.RemoveUser(user);
              
              RefreshBrowser();
            }
          }
          else if(TrainUtil.HasPrefix(msg.minor, "live://unassign_friend/"))
          {
            string command = Str.Tokens(msg.minor, "live://unassign_friend/")[0];
            if(command)
            {
              assignedFriend = "";
              RefreshBrowser();
            }
          }
          else
          {
            //PROCESS CUSTOM MENU COMMANDS
            if(popup and msg.src == popup)
            {
              int i;
              for(i = 0; i < customMenus.size(); i++)
                customMenus[i].ProcessMessage(msg.minor);
            }
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
