include "tttebase.gs"
include "world.gs"

// ============================================================================
// Name: CustomScriptMenu
// Desc: Inherit this class to add custom script menu functionality.
// ============================================================================
class CustomScriptMenu
{
  TTTEBase base;

  public string GetMenuHTML()
  {
    return "";
  }

  public string GetIconKUIDString()
  {
    return "";
  }

  public void ProcessMessage(string cmd)
  {
  }

  //DO NOT OVERRIDE THESE!

  public CustomScriptMenu Init(TTTEBase _base)
  {
    base = _base;
    return me;
  }

  public bool IsCore()
  {
    return false;
  }
};

class EyeScriptMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }
  
  public string GetMenuHTML()
  {
  	HTMLBuffer output = HTMLBufferStatic.Construct();
  	output.Print("<html><body>");
  	output.Print("<table>");

    //Options
    output.Print("<tr><td>");
    output.Print("<font><b>" + base.strTable.GetString("eye_menu") + "</font>");
    output.Print("<br>");
    output.Print("<a href='live://eye-reset' tooltip='" + base.strTable.GetString("tooltip_reset") + "'><font>" + base.strTable.GetString("reset_controls") + "</font></a>");
    output.Print("</tr></td>");

    //controls
    output.Print("<tr><td>");
    output.Print(base.strTable.GetString("eye_rotation_h"));
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeX' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print(base.strTable.GetString("eye_rotation_v"));
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=standard-slider width=300 height=20 id='eyeY' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</tr></td>");

    //dial is no longer advanced lol
    output.Print("<tr><td>");
    output.Print("<trainz-object style=dial width=100 height=100 id='eyeZ' texture='newdriver/dcc/dcc_controller.tga' min=0.0 max=1.0 valmin=0.0 valmax=360.0 step=0 clickstep=1 value=0.0></trainz-object>");
    output.Print("</tr></td>");

    output.Print("<tr><td>");
    output.Print("<a href='live://record'><font>" + base.strTable.GetString("recording_start") + "</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://record-stop'><font>" + base.strTable.GetString("recording_stop") + "</font></a>");
    output.Print("<br>");
    output.Print("<a href='live://play'><font>" + base.strTable.GetString("recording_anim") + "</font></a>");
    output.Print("</tr></td>");

    output.Print("</table>");

    output.Print("<br>");
    output.Print(HTMLWindow.CheckBox("live://eye-lock", base.useLockTarget));
  	output.Print(base.strTable.GetString("target_lock") + "</tr></td>");
    if(base.useLockTarget)
  	{
      string targetText = base.strTable.GetString("target_select");
      if(base.selectingTarget)
        targetText = base.strTable.GetString("target_looking");
      else if(base.eyeLockTarget != null)
        targetText = base.eyeLockTarget.GetAsset().GetLocalisedName();
  		output.Print("<br>");
  		output.Print("<a href='live://eye-lock-select' tooltip='" + base.strTable.GetString("target_select_eye") + "'>" + targetText + "</a>");
  	}

  	output.Print("</body></html>");

  	return output.AsString();
  }

  public string GetIconKUIDString()
  {
    return "<kuid:414976:103313>";
  }

  public void ProcessMessage(string cmd)
  {
    if(cmd == "live://eye-reset")
    {
      base.popup.SetElementProperty("eyeX","value",(string)0.0);
      base.popup.SetElementProperty("eyeY","value",(string)0.0);
      base.popup.SetElementProperty("eyeZ","value",(string)0.0);
    }
    else if (cmd == "live://record")
    {
    }
    else if (cmd == "live://record-stop")
    {
    }
    else if (cmd == "live://play")
    {
    }
    else if (cmd == "live://eye-lock")
    {
      base.useLockTarget = !base.useLockTarget;
    }
    else if (cmd == "live://eye-lock-select")
    {
      World.SetTargetObserver(base.self);
      base.selectingTarget = true;
    }

    base.RefreshBrowser();
  }
};