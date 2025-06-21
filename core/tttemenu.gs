include "tttebase.gs"
include "world.gs"

// ============================================================================
// Name: CustomScriptMenu
// Desc: Inherit this class to add custom script menu functionality.
// ============================================================================
class CustomScriptMenu
{
  public TTTEBase base;
  public bool _tick_running = false;

  // ============================================================================
  // Custom Override Functions
  // Desc: Override the following functions in your derived menu class to add functionality.
  // ============================================================================

  // ============================================================================
  // Name: GetMenuHTML()
  // Desc: Returns the menu HTML.
  // ============================================================================
  public string GetMenuHTML()
  {
    return "";
  }

  // ============================================================================
  // Name: GetIconKUIDString()
  // Desc: Returns the KUID of the menu's icon as a string.
  // ============================================================================
  public string GetIconKUIDString()
  {
    return "";
  }

  // ============================================================================
  // Name: GetIconTextureIndex()
  // Desc: Returns the index of the menu's icon in the texture-group asset
  //       specified by GetIconKUIDString, or -1 if it isn't a texture group asset.
  // ============================================================================
  public int GetIconTextureIndex()
  {
    return -1;
  }

  // ============================================================================
  // Name: ProcessMessage(string cmd)
  // Desc: Process any link messages.
  // ============================================================================
  public void ProcessMessage(string cmd)
  {
  }

  // ============================================================================
  // Name: CustomScriptMessage(Message msg)
  // Desc: Process a message callback.
  // ============================================================================
  public void CustomScriptMessage(Message msg)
  {
  }

  // ============================================================================
  // Name: Open()
  // Desc: Called when the menu is opened. Will be called each time the menu is opened, don't do any one-time initialization here.
  // ============================================================================
  public void Open()
  {
  }

  // ============================================================================
  // Name: Close()
  // Desc: Called when the menu is closed (after Tick has finished).
  // ============================================================================
  public void Close()
  {
  }

  // ============================================================================
  // Name: PostRefresh()
  // Desc: Called after the menu has been refreshed.
  // ============================================================================
  public void PostRefresh()
  {
  }

  // ============================================================================
  // Name: Tick()
  // Desc: The primary menu thread - will be called at the interval specified by GetTickInterval()
  // ============================================================================
  public void Tick()
  {
  }

  // ============================================================================
  // Name: GetTickInterval()
  // Desc: Returns the interval (in seconds) between calls to Tick() - default -1.0 to never call Tick()
  // ============================================================================
  public float GetTickInterval()
  {
    return -1.0;
  }

  // ============================================================================
  // Name: AlwaysTick()
  // Desc: Whether this menu should always tick, regardless of its selection status. Warning: this will prevent Close() from being called until you call StopTick().
  // ============================================================================
  public bool AlwaysTick()
  {
    return false;
  }

  // Helper functions
  // ============================================================================
  // Name: GetBrowser()
  // Desc: Returns the Browser object that contains this menu.
  // ============================================================================
  public Browser GetBrowser()
  {
    return base.popup;
  }

  // ============================================================================
  // Name: GetMenuWidth()
  // Desc: Returns the width required by this menu.
  // ============================================================================
  public int GetMenuWidth()
  {
    return TTTEBase.POPUP_WIDTH;
  }

  //DO NOT OVERRIDE THESE!

  // public CustomScriptMenu Init(TTTEBase _base)
  // {
  //   base = _base;
  //   return me;
  // }

  public void Init()
  {
  }

  public bool IsCore()
  {
    return false;
  }

  void StopTick()
  {
    _tick_running = false;
  }
};