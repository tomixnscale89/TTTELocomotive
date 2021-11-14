include "gs.gs"
include "tttehelpers.gs"
include "tttemenu.gs"
include "vehicle.gs"

class TTTEBase isclass TTTEHelpers
{
  public Vehicle self;

  Asset ScriptAsset;
  public StringTable strTable; // This asset's string table, saved for convenient fast access

  public bool useLockTarget = false;
  public bool selectingTarget = false;
  public MapObject eyeLockTarget;

  public Browser popup;
  public define int BROWSER_NONE         = 0;
  public define int BROWSER_EYEMENU      = 1;
  public define int BROWSER_JOYSTICKMENU = 2;
  public define int BROWSER_LAMPMENU     = 3;
  public define int BROWSER_LIVERYMENU   = 4;
  public define int BROWSER_FACEMENU     = 5;
  public define int BROWSER_LOCOMENU     = 6;
  public define int BROWSER_SMOKEMENU    = 7;
  public define int BROWSER_SOCIALMENU   = 8;
  public define int BROWSER_CUSTOMMENU_0 = 9;

  public void RefreshBrowser()
  {
  }

  // ============================================================================
  // Custom Override Functions
  // Desc: Override the following functions in tttestub.gs to provide custom functionality.
  // ============================================================================

  // ============================================================================
  // Name: GetCustomMenus()
  // Desc: Return a list of custom script menus supported by this locomotive.
  // ============================================================================
  public CustomScriptMenu[] GetCustomMenus()
  {
    return new CustomScriptMenu[0];
  }
};