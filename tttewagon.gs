
include "vehicle.gs"
include	"meshobject.gs"
include "couple.gs" //procedural coupler <kuid:414976:104101> Procedural Coupler

// ============================================================================
// Name: tttewagon
// Desc: Script class for a generic TTTE Wagon
// ============================================================================
class tttewagon isclass Vehicle
{
  // ****************************************************************************/
  // Define Variables
  // ****************************************************************************/
  Asset ScriptAsset;
  StringTable strTable; // This asset's string table, saved for convenient fast access

  
  // ============================================================================
  // Name: Init()
  // Desc: The Init function is called when the object is created
  // ============================================================================
  public void Init(Asset asset) // Let's keep the init at the top for ease of access
  {
    // call the parent
    inherited(asset);


  }
};
