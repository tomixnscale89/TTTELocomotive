// ============================================================================
// TTTELocmotive.gs
// Desc: Script designed to make Thomas models more simple for Trainz.
// Key features of this script are:
// Replaceable faces with the capabilities of a smokebox door.
// Eye directions are now handled separately, which makes eye direction easier for content creators.
// This script is provided as is and people are welcome to publish updates. The source will be available on github.
// ============================================================================
  
include "locomotive.gs" 


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
  // Define Variables
  // ****************************************************************************/
  StringTable strTable; // This asset's string table, saved for convenient fast access
  


  Asset headlight_asset;      // headlight asset used by the loco
  Asset rear_headlight_asset; // Backup headlight (not sure if we want this)
  Asset coupler_hanging, coupler_coupled;											// two options for the coupler
  Asset driver, fireman;	// fireman and driver meshes 


  // ACS Stuff
  Library     ACSlib;   // reference to the Advanced Coupling System Library
  GSObject[] ACSParams; // not sure what this is 




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

  Train m_train;


  
  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init() // Let's keep the init at the top for ease of access 
  {
    // call the parent
    inherited();

   // ****************************************************************************/
  // Define ACS Stuff
  // ****************************************************************************/
  ACSlib = World.GetLibrary(GetAsset().LookupKuidTable("acslib"));



  }
  

};