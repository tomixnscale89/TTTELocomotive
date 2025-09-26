include "tttemenu.gs"


class LiveryMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }
  
  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<h1><b>Liveries</h1>");
    output.Print("<br>");
    // output.Print("<label>" + base.strTable.GetString("skin_description") + "</label>");
    // output.Print("<br>");

    output.Print("<table>");
    output.Print("<tr> <td width='300'></td> </tr>");
    bool rowParity = false;
    int i;
    for(i = 0; i < base.LiveryContainer.CountTags(); i++)
    {
      rowParity = !rowParity;
      string liveryName = base.LiveryContainer.GetNamedTag(base.LiveryContainer.GetIndexedTagName(i));
      if (rowParity)
        output.Print("<tr bgcolor=" + Colors.Primary + ">");
      else
        output.Print("<tr bgcolor=" + Colors.PrimaryDark + ">");

      output.Print("<td>");
      if(i != base.skinSelection)
        output.Print("<a href='live://livery_set/" + i + "'>");

      output.Print("<label>" + liveryName + "</label>");

      if(i != base.skinSelection)
        output.Print("</a>");

      output.Print("</td>");
      output.Print("</tr>");
    }
    output.Print("</table>");
    output.Print("</body></html>");
    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:103610>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 15;
  }

  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://livery_set/"))
    {
      string command = Str.Tokens(cmd, "live://livery_set/")[0];
      if(command)
      {
        base.skinSelection = Str.UnpackInt(command);
        base.ConfigureSkins();
      }
    }

    base.RefreshBrowser();
  }
};