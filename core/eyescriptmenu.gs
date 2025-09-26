include "tttemenu.gs"


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
    output.Print("<h1><b>" + base.strTable.GetString("eye_menu") + "</h1>");
    output.Print("<br>");
    output.Print("<a href='live://eye-reset' tooltip='" + base.strTable.GetString("tooltip_reset") + "'><label>" + base.strTable.GetString("reset_controls") + "</label></a>");
    output.Print("</td></tr>");

    //controls
    output.Print("<tr><td width=100%>");
    output.Print("<label>" + base.strTable.GetString("eye_rotation_h") + "</label>");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='eyeX' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</td></tr>");

    output.Print("<tr><td width=100%>");
    output.Print("<label>" + base.strTable.GetString("eye_rotation_v") + "</label>");
    output.Print("<br>");
    output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='eyeY' min=-38 max=38 value=0.0 page-size=0></trainz-object>");
    output.Print("</td></tr>");

    //dial is no longer advanced lol
    output.Print("<tr><td>");
    output.Print("<trainz-object style=dial width=100 height=100 id='eyeZ' texture='newdriver/dcc/dcc_controller.tga' min=0.0 max=1.0 valmin=0.0 valmax=360.0 step=0 clickstep=1 value=0.0></trainz-object>");
    output.Print("</td></tr>");

    output.Print("<tr><td>");
    output.Print("<a href='live://record'><label>" + base.strTable.GetString("recording_start") + "</label></a>");
    output.Print("<br>");
    output.Print("<a href='live://record-stop'><label>" + base.strTable.GetString("recording_stop") + "</label></a>");
    output.Print("<br>");
    output.Print("<a href='live://play'><label>" + base.strTable.GetString("recording_anim") + "</label></a>");
    output.Print("</td></tr>");

    output.Print("</table>");

    output.Print("<br>");
    output.Print(base.LabeledCheckbox("live://eye-lock", base.useLockTarget, base.strTable.GetString("target_lock")));

    if(base.useLockTarget)
  	{
      string targetText = base.strTable.GetString("target_select");
      if(base.selectingTarget)
        targetText = base.strTable.GetString("target_looking");
      else if(base.eyeLockTarget != null)
        targetText = base.eyeLockTarget.GetAsset().GetLocalisedName();
  		output.Print("<br>");
  		output.Print("<a href='live://eye-lock-select' tooltip='" + base.strTable.GetString("target_select_eye") + "'><label>" + targetText + "</label></a>");
  	}

  	output.Print("</body></html>");

  	return output.AsString();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:103313>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 27;
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