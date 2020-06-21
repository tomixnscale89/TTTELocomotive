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
  bool SoupHasTag(Soup testSoup, string tagName);
  thread void BufferThread();

  Soup myConfig;
  Soup ExtensionsContainer;
  Soup BuffersContainer;

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

  inherited();

  myConfig = me.GetAsset().GetConfigSoup();
  ExtensionsContainer = me.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
  BuffersContainer = ExtensionsContainer.GetNamedSoup("buffers");
  if(BuffersContainer.CountTags() > 0)
  {
    BufferThread();
  }


  }
  // ============================================================================
  // Name: BufferThread()
  // Desc: Manages buffer interaction.
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
};
