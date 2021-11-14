include "tttebase.gs"
include "world.gs"

// ============================================================================
// Name: CustomScriptMenu
// Desc: Inherit this class to add custom script menu functionality.
// ============================================================================
class CustomScriptMenu
{
  public TTTEBase base;

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
  // Name: ProcessMessage(string cmd)
  // Desc: Process any link messages.
  // ============================================================================
  public void ProcessMessage(string cmd)
  {
  }

  // ============================================================================
  // Name: Open()
  // Desc: Called when the menu is opened.
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
};