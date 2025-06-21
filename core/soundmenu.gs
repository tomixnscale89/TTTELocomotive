include "tttemenu.gs"


class SoundMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");

    if(base.SoundContainer and base.SoundContainer.CountTags())
    {
      output.Print("Sounds:");
      output.Print("<br>");
      output.Print("<table>");
      output.Print("<tr> <td width='264'></td> <td width='18'></td> <td width='18'></td> </tr>");
      bool rowParity = false;
      int i;
      for(i = 0; i < base.SoundContainer.CountTags(); i++)
      {
        rowParity = !rowParity;
        string soundName = base.SoundContainer.GetIndexedTagName(i);
        string nameText = base.SoundContainer.GetNamedTag(soundName);
        if (rowParity)
          output.Print("<tr bgcolor=" + Colors.Primary + ">");
        else
          output.Print("<tr bgcolor=" + Colors.PrimaryDark + ">");

        output.Print("<td>");
        output.Print(nameText);
        output.Print("</td>");

        output.Print("<td><a href='live://play-sound/" + (string)i + "'><img kuid='<kuid:414976:102811>' width=16 height=16></a></td>");
        output.Print("<td><a href='live://stop-sound/" + (string)i + "'><img kuid='<kuid:414976:102812>' width=16 height=16></a></td>");
        

        output.Print("</tr>");
      }
      output.Print("</table>");
    }

    output.Print("</body></html>");

    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:102809>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 35;
  }

  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://play-sound/"))
    {
      string command = cmd["live://play-sound/".size(),];
      if(command)
      {
        int targetSound = Str.ToInt(command);
        string soundName = base.SoundContainer.GetIndexedTagName(targetSound);
        base.self.PlaySoundScriptEvent(soundName);
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://stop-sound/"))
    {
      string command = cmd["live://stop-sound/".size(),];
      if(command)
      {
        int targetSound = Str.ToInt(command);
        string soundName = base.SoundContainer.GetIndexedTagName(targetSound);
        base.self.StopSoundScriptEvent(soundName);
      }
    }

    base.RefreshBrowser();
  }
};