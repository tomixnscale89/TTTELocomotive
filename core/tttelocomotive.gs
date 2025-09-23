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
include "tttewagon.gs"

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
// Name: TTTELocomotive
// Desc: Script class for a generic TTTE Locomotive
// ============================================================================

class TTTELocomotive isclass Locomotive, TTTEBase
{
  bool initSuccessful = false;
  bool inLegacyInit = false;

  // ****************************************************************************/
  // Define Functions
  // ****************************************************************************/

  int DetermineCarPosition(void);
  void SniffMyTrain(void);
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


  thread void EyeScriptCheckThread(void);
  //thread void JoystickThread(void);
  thread void BufferThread();
  thread void OnlineEyeThread();
  void SetEyeMeshOrientation(float x, float y, float z);
  thread void MultiplayerBroadcast(void);
  void createMenuWindow();
  void RefreshMenuBrowser();
  void UpdateInterfacePosition();
  void UpdateInterfacePositionHandler(Message msg);
  //thread void ScanBrowser(void);
  thread void BrowserThread();

  void WhistleMonitor(Message msg);
  thread void HeadlightMonitor();

   // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/
  bool AssetObsolete = false;
  KUID ObsoletedBy;

  Asset driver, fireman;	// fireman and driver meshes


  bool m_cameraViewpoint; // Current Camera point
  bool m_cameraTarget; // Is this the camera target?

  bool m_trainzModule;

  float trainzVersion = World.GetTrainzVersion();

  // ACS Stuff
  Library     ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams; // not sure what this is

  IKCoupler FrontCoupler;
  IKCoupler BackCoupler;
  Vehicle LastCoupleInteraction;

  //Eyescript Variables
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
  bool BrowserClosed;

  int m_carPosition; // position of car in train - one of the options above

  Train train;


  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init(Asset asset) // Let's keep the init at the top for ease of access
  {
    // For legacy tttestub compat, we now call inherited at the end.
    // In the meantime, set m_trainzAsset, so calls to GetAsset still work.
    m_trainzAsset = asset;
    // inherited(asset);

    self = me;
    BaseInit(asset);
    


    CheckScriptAssetObsolete();
    //CheckDLSAdditionalContent();

    //TrainzScript.Log("searching for ttte settings lib");

    // ****************************************************************************/
    // Grab assets from the Locomotive
    // ****************************************************************************/

    eyeQueue = new EyeFrame[0];

    FacesContainer = ExtensionsContainer.GetNamedSoup("faces");
    ExtraLampsContainer = ExtensionsContainer.GetNamedSoup("extra-lamps");
    FaceChartContainer = ExtensionsContainer.GetNamedSoup("face-chart");

    if(FacesContainer.CountTags()) SetFeatureSupported(FEATURE_FACES);
    if(HasMesh("eye_l") and HasMesh("eye_r")) SetFeatureSupported(FEATURE_EYES);
    if(FaceChartContainer.CountTags()) SetFeatureSupported(FEATURE_FACECHART);

    Soup TTTESettings = GetTTTELocomotiveSettings();
    bool RandomizeFaces = TTTESettings.GetNamedSoup("random-faces/").GetNamedTagAsBool("value", false);

    if(RandomizeFaces and FacesContainer.CountTags()) faceSelection = Math.Rand(0, FacesContainer.CountTags());
    else if (FacesContainer.CountTags())
    {
      // give us a face.
      faceSelection = 0;
    }
    
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
    AddHandler(me, "TTTESetLivery", "", "SetLiveryHandler");

    EyeScriptCheckThread();
    if(MultiplayerGame.IsActive())
      MultiplayerBroadcast();

    // ****************************************************************************/
    // Define Camera Handlers for hiding/showing the low poly exterior cab on steam locos.
    // ****************************************************************************/
    AddHandler(Interface, "Camera", "Internal-View",    "CameraInternalViewHandler");
    AddHandler(Interface, "Camera", "External-View",    "CameraInternalViewHandler");
    AddHandler(Interface, "Camera", "Tracking-View",    "CameraInternalViewHandler");
    AddHandler(Interface, "Camera", "Roaming-View",     "CameraInternalViewHandler");
    AddHandler(Interface, "Camera", "Target-Changed",   "CameraTargetChangedHandler");



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


    //create the browser menu - this could be changed later to link to a pantograph or keybind
    createMenuWindow();
    //ScanBrowser();
    AddHandler(me, "Browser-URL", "", "BrowserHandler");
    AddHandler(me, "CustomScriptMessage", "", "CustomScriptHandler");
    BrowserThread();

    m_carPosition = DetermineCarPosition();

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


    train = me.GetMyTrain(); // Get the train
    SniffMyTrain(); // Then sniff it

    HeadlightMonitor();

    //listen for user change messages in the online group
    //although this message is sent to OnlineGroup objects, it is forwarded to the online group library through Sniff
    if(GetOnlineLibrary())
    {
      AddHandler(GetOnlineLibrary(), "TTTEOnline", "UsersChange", "UsersChangeHandler");
      AddHandler(GetOnlineLibrary(), "TTTEOnline", "Update", "OnlineUpdateHandler");
      OnlineEyeThread();
    }

    // Finally, call the parent.
    inLegacyInit = true;
    inherited(asset);
    inLegacyInit = false;

    initSuccessful = true;
  }

  public void ModuleInitHandler(Message msg)
  {
    //regenerate browser
    BrowserClosed = true;
  }

  // @override
  public bool HasFocus()
  {
    return m_cameraTarget;
  }

  // ============================================================================
  // Name: IsTargetLoco()
  // Desc: Checks if this locomotive is the target.
  // ============================================================================
  bool IsTargetLoco()
  {
    return GetMyTrain() == World.GetCurrentTrain();
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

  void SetLiveryHandler(Message msg)
  {
    int skin = LiveryContainer.GetIndexForNamedTag(msg.minor);
    if(skin != -1)
    {
      skinSelection = skin;
      ConfigureSkins();
    }
  }

  // ============================================================================
  // Name: PropagateSkins()
  // Desc: Propagates the current skin to all tenders.
  // ============================================================================
  public void PropagateSkins()
  {
    TrainzScript.Log("Propagating skin");
    string liveryName = LiveryContainer.GetIndexedTagName(skinSelection);

    Train train = GetMyTrain();
    Vehicle[] vehicles = train.GetVehicles();

    int i;
    for(i = 0; i < vehicles.size(); i++)
    {
      if(vehicles[i] == self or (vehicles[i].GetVehicleTypeFlags() & Vehicle.TYPE_TENDER) != Vehicle.TYPE_TENDER)
        continue;

      PostMessage(vehicles[i], "TTTESetLivery", liveryName, 0.0);
    }
  }

  // ============================================================================
  // Name: ConfigureSkins()
  // Parm:  None
  // Desc:
  // ============================================================================
  public void ConfigureSkins()
  {
    inherited();
    PropagateSkins();
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
        if (FrontCoupler)
          FrontCoupler.CoupleTo(OppositeCoupler);
      }
      else if(direction == "back")
      {
        if (BackCoupler)
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

      Sleep(0.08);
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
        if (train)
          Sniff(train, "Train", "", true);
      }
    }
    else if (train)
    {
      Sniff(train, "Train", "", true);
    }
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
    html = html + TTTEGetDescriptionHTML();
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
    string ret = TTTEGetPropertyType(p_propertyID);
    if (ret != "") return ret;
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
    string ret = TTTEGetPropertyName(p_propertyID);
    if (ret != "") return ret;
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
    string ret = TTTEGetPropertyDescription(p_propertyID);
    if (ret != "") return ret;
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
    string[] ret = TTTEGetPropertyElementList(p_propertyID);
    if (ret) return ret;
    return inherited(p_propertyID);
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
    if (!TTTESetPropertyValue(p_propertyID, p_value, p_index))
    {
      inherited(p_propertyID, p_value, p_index);
    }
  }

  void SetPropertyValue(string p_propertyID, GSObject p_value, string p_readableName)
  {
    if (!TTTESetPropertyValue(p_propertyID, p_value, p_readableName))
    {
      inherited(p_propertyID, p_value, p_readableName);
    }
  }

  // ============================================================================
  // Name: SetEyeMeshOrientation()
  // Desc: Sets the locomotive eye rotation.
  // ============================================================================

  void SetEyeMeshOrientation(float x, float y, float z)
	{
    if(eyeTranslateX or eyeTranslateY)
    {
      float translateX = 0.0;
      float translateZ = 0.0;

      if(eyeTranslateX)
      {
        translateX = z * eyeTranslateXScale / 4.0;
        z = 0.0;
      }
      if(eyeTranslateY)
      {
        translateZ = -x * eyeTranslateYScale / 4.0;
        x = 0.0;
      }

      SetMeshTranslation("eye_l", translateX, 0.0, translateZ);
      SetMeshTranslation("eye_r", translateX, 0.0, translateZ);
    }

    SetMeshOrientation("eye_l", x, y, z);
		SetMeshOrientation("eye_r", x, y, z);
	}

  // ============================================================================
  // Name: ControlSet Handlers
  // ============================================================================

  public void HandleXAxis(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    if(HasFocus() or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
    {
      Soup parameters = msg.paramSoup;
      eyeX = (parameters.GetNamedTagAsFloat("control-value") - 0.5) * 1.2;
      SetEyeMeshOrientation(eyeY, eyeZ, eyeX);
    }
  }

  public void HandleYAxis(Message msg)
  {
    //Cabin Source = cast<Cabin>msg.src;
    if(HasFocus() or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
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
    if(HasFocus() or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
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
    if(HasFocus() or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
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
    if(HasFocus() or IsTargetLoco()) // and Source and cast<Locomotive>Source.GetParentObject() == me
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

  void UsersChangeHandler(Message msg)
  {
    RefreshBrowser();
  }

  void OnlineUpdateHandler(Message msg)
  {
    OnlineUpdate(msg);
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

    int icon_scale = 40;

    if(AssetObsolete)
    {
      //output.Print("<a href='live://update'>Out of date! Click here to update.</a>");
      //output.Print("<br>");
      output.Print("<tr><td>");
      output.Print("<a href='live://update'><img kuid='<kuid:414976:101435>' width=" + icon_scale + " height=" + icon_scale + "></a>");
      output.Print("</td></tr>");
    }

    // give a little thumbnail of the traincar in question
    output.Print("<tr><td>");
    output.Print("<a href='live://focus-me' tooltip='" + GetLocalisedName() + "'><img kuid='" + GetAsset().GetKUID().GetHTMLString() + "' width=" + icon_scale + " height=" + icon_scale + "></a>");
    output.Print("</td></tr>");

    int i;
    if (customMenus)
    {
      for(i = 0; i < customMenus.size(); i++)
      {
        output.Print("<tr><td>");

        output.Print("<a href='live://open_custom/" + (string)i + "'>");

        int textureIndex = customMenus[i].GetIconTextureIndex();
        if (textureIndex >= 0)
        {
          output.Print("<img texturegroup='" + customMenus[i].GetIconKUIDString() + "' textureindex=" + (string)textureIndex + " width=" + icon_scale + " height=" + icon_scale + ">");
        }
        else
        {
          output.Print("<img kuid='" + customMenus[i].GetIconKUIDString() + "' width=" + icon_scale + " height=" + icon_scale + ">");
        }

        output.Print("</a>");
        output.Print("</td></tr>");
      }
    }

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
    Sniff(browser, "Browser-URL", "", true);
    
    browser.SetCloseEnabled(false);
  	//browser.SetWindowPosition(Interface.GetDisplayWidth()-450, Interface.GetDisplayHeight() - 625);
  	browser.SetWindowSize(BROWSER_WIDTH, 400);
    browser.SetWindowStyle(Browser.STYLE_NO_FRAME);
    browser.SetMovableByDraggingBackground(false);
  	browser.SetWindowVisible(true);
  	browser.LoadHTMLString(GetAsset(), GetMenuHTML());
    browser.ResizeHeightToFit();
    BrowserClosed = false;

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

  // @override
  public bool ShouldShowPopup()
  {
    if (AttachParent and AttachParent.ShouldShowPopup())
      return true;
    
    return HasFocus() or IsTargetLoco();
  }

    
  // ============================================================================
  // Name: BrowserThread()
  // Desc: Recreates the browser if it is closed. (should be swapped for a module change handler)
  // ============================================================================

  thread void BrowserThread()
  {
    while(true)
    {
      if (!me.ShouldShowPopup())
      {
        CurrentMenu = null;
        browser = null;
        popup = null;
        BrowserClosed = true;
      }
      if (me.ShouldShowPopup() and BrowserClosed)
      {
        //replace this with keybind
        createMenuWindow();
        BrowserClosed = false;
      }

      UpdateInterfacePosition();

      Sleep(0.1);
    }
  }

  // ============================================================================
  // Name: BrowserHandler(Message msg)
  // Desc: Handles all browser input.
  // ============================================================================
  void BrowserHandler(Message msg)
  {
    TrainzScript.Log("handle browser message");
    if(!(browser and msg.src == browser) and !(popup and msg.src == popup))
      return;
    
    if (msg.minor == "live://update")
    {
      ShowUpdatePrompt();
      AssetObsolete = false;
      RefreshBrowser();
    }
    else if (msg.minor == "live://focus-me")
    {
      World.UserSetCamera(me);
    }
    else if (msg.minor == "live://return")
    {
      closePopup();
    }
    else if(TrainUtil.HasPrefix(msg.minor, "live://open_custom/"))
    {
      TrainzScript.Log("Opening custom menu.");
      string command = msg.minor["live://open_custom/".size(),];

      int menuID = Str.UnpackInt(command);

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
    else
    {
      if(CurrentMenu)
        CurrentMenu.ProcessMessage(msg.minor);
    }
  }

  void CustomScriptHandler(Message msg)
  {
    if(CurrentMenu) CurrentMenu.CustomScriptMessage(msg);
  }
};

//Legacy tttestub compat
// Moral of the story: never let brendan write user-facing code again kek
class tttelocomotive isclass TTTELocomotive
{
  public Asset baseAsset;
  public string[] kuidTable;
  string authorStr;
  string authorEmail;

  void EvilDialogBox();

  public void InitTable()
  {
    int i;
    Soup config = baseAsset.GetConfigSoup();
    for (i = 0; i < config.CountTags(); i++)
    {
      string tagName = Str.CloneString(config.GetIndexedTagName(i));
      Str.ToLower(tagName);

      if (tagName == "author")
      {
        authorStr = config.GetNamedTag("author");
      }
      if (tagName == "contact-email")
      {
        authorEmail = config.GetNamedTag("contact-email");
      }
    }

    Soup table = config.GetNamedSoup("kuid-table");
    kuidTable = new string[0];
    for (i = 0; i < table.CountTags(); i++)
    {
      string tagName = Str.CloneString(table.GetIndexedTagName(i));
      Str.ToLower(tagName);
      kuidTable[kuidTable.size()] = tagName;
    }
  }
  
  public bool HasAsset(string asset)
  {
    string lowerAsset = Str.CloneString(asset);
    Str.ToLower(lowerAsset);

    int i;
    for (i = 0; i < kuidTable.size(); i++)
    {
      if (kuidTable[i] == lowerAsset)
        return true;
    }

    return false;
  }

  void EvilDialogBox()
  {
    bool isThisMine = baseAsset.IsCreatedByLocalUser();
    string dontShowAgainStr = "";
    if (!isThisMine)
    {
      // Always pester the content creator.
      dontShowAgainStr = "ttteloco-evil-" + baseAsset.GetLocalisedName();
    }
    
    string authorName = baseAsset.GetCreatorName();
    if (authorStr)
    {
      authorName = authorName + " (a.k.a. " + authorStr + ")";
    }
    if (authorEmail and !isThisMine)
    {
      authorName = authorName + ", who can be reached at " + authorEmail;
    }

    string kHelpMessage;
    if (isThisMine)
    {
      kHelpMessage = "Hey you! " + authorName + "! Yeah, you!\n" +
      "According to my amazing powers of deduction, this asset, " + baseAsset.GetLocalisedName() + ", belongs to you!\n" +
      "You've screwed up big time, so listen up!\n" +
      "This TTTELocomotive asset has been configured improperly. But fret not, the solution is easy!\n" +
      "In the asset files, you've used a tttestub.gs that's only supposed to be used for specific locomotives (those with custom driver/fireman attachments).\n" +
      "Please use the tttestub.gs available here:\n" +
      "https://github.com/tomixnscale89/TTTELocomotive/blob/master/tttestub.gs\n\n" +
      "We're gonna be removing this dialog box soon, so if you see this message box please fix this ASAP!!\n" +
      "If you don't, this asset will become faulty one day!\n" +
      "Thanks!\n    -The TTTELocomotive Team";
    }
    else
    {
      kHelpMessage = "Hey you! Yeah, you!\n" +
      "This asset, " + baseAsset.GetLocalisedName() + ", has been configured improperly!\n" +
      "Please redownload this locomotive from wherever you got it!\n" +
      "If it's still broken, please let the content author, " + authorName + " know:\n\n" +
      "In the asset files, they've used a tttestub.gs that's only supposed to be used for specific locomotives (those with custom driver/fireman attachments).\n" +
      "Please tell them to use the tttestub.gs available here:\n" +
      "https://github.com/tomixnscale89/TTTELocomotive/blob/master/tttestub.gs\n\n" +
      "We're gonna be removing this dialog box soon, so if you see this message box please tell the content creator to fix this ASAP!!\n" +
      "If they don't, this asset will become faulty one day!\n" +
      "Thanks!\n\n    -The TTTELocomotive Team";
    }

    bool isError = isThisMine;

    Interface.ShowMessageBox(me, kHelpMessage, isError, "Got it!", "Cancel", dontShowAgainStr);
  }

  thread void SurvivedInit()
  {
  }

  public void Init(Asset asset)
  {
    // Install the watchdog.
    baseAsset = asset;
    InitTable();
    
    inherited(asset);
  }

  public void Init()
	{
		inherited();

    // If tttestub is bugged, we will die right after this call ends.
    // Queue up a thread to check if we survived.
    SurvivedInit();
	}

  public Asset GetAsset()
  {
    // If we're calling GetAsset from a legacy tttestub's Init function, we're about to crash and burn.
    if (inLegacyInit)
    {
      if (!HasAsset("driver") or !HasAsset("fireman"))
        EvilDialogBox();
    }

    return inherited();
  }
};
