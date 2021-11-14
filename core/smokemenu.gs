include "tttemenu.gs"


class SmokeMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }
  
  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    output.Print("<table>");

    //Generate smoke containers
    int i;
    for(i = 0; i < base.SmokeEdits.CountTags(); i++)
    {
      Soup CurrentSmoke = base.SmokeEdits.GetNamedSoup((string)i);
      output.Print("<tr><td>");
      output.Print("<b>");
      output.Print("smoke" + (string)i + " ");
      output.Print("</b>");

      if(CurrentSmoke.GetNamedTagAsBool("expanded")) output.Print("<a href='live://contract/" + (string)i + "'>-</a>");
      else output.Print("<a href='live://expand/" + (string)i + "'>+</a>");

      output.Print("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
      if(i != base.BoundWheesh)
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

  public string GetIconKUIDString()
  {
    return "<kuid:414976:103612>";
  }

  // ============================================================================
  // Name: RefreshSmokeTags()
  // Desc: Updates all smoke sliders.
  // ============================================================================

  public void RefreshSmokeTags()
  {
    int i;
    for(i = 0; i < base.SmokeEdits.CountTags(); i++)
    {
      Soup CurrentSmoke = base.SmokeEdits.GetNamedSoup((string)i);
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

  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://smoke-update/"))
    {
      string command = cmd;
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

        base.popup.SetTrainzText(command + "-text", (string)value);

        RefreshSmokeTags();
        base.UpdateSmoke();
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://contract/"))
    {
      string command = Str.Tokens(cmd, "live://contract/")[0];
      if(command)
      {
        Soup smoke = SmokeEdits.GetNamedSoup(command);
        smoke.SetNamedTag("expanded", false);
        base.RefreshBrowser();
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://expand/"))
    {
      string command = Str.Tokens(cmd, "live://expand/")[0];
      if(command)
      {
        Soup smoke = SmokeEdits.GetNamedSoup(command);
        smoke.SetNamedTag("expanded", true);
        base.RefreshBrowser();
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://smoke-bind/"))
    {
      string command = Str.Tokens(cmd, "live://smoke-bind/")[0];
      if(command)
      {
         BoundWheesh = Str.UnpackInt(command);
         base.RefreshBrowser();
      }
    }
  }
};