include "tttemenu.gs"


class SubmeshMenu isclass CustomScriptMenu
{
  bool[] submeshState;

  public bool IsCore() { return true; }

  public void Init()
  {
    inherited();
    if(base.SubmeshContainer)
      submeshState = new bool[base.SubmeshContainer.CountTags()];

    int i;
    for(i = 0; i < base.SubmeshContainer.CountTags(); i++)
    {
      string meshName = base.SubmeshContainer.GetIndexedTagName(i);
      Soup mesh = base.myConfig.GetNamedSoup("mesh-table").GetNamedSoup(meshName);
      submeshState[i] = mesh.GetNamedTagAsBool("auto-create", false);
    }
  }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");
    //output.Print("<a href='live://return' tooltip='" + strTable.GetString("tooltip_return") + "'><b><font>" + strTable.GetString("menu") + "</font></b></a>");
    output.Print("<br>");

    if(base.SubmeshContainer and base.SubmeshContainer.CountTags())
    {
      output.Print("Submeshes:");
      output.Print("<br>");
      output.Print("<table>");
      output.Print("<tr> <td width='300'></td> </tr>");
      bool rowParity = false;
      int i;
      for(i = 0; i < base.SubmeshContainer.CountTags(); i++)
      {
        rowParity = !rowParity;
        string submeshName = base.SubmeshContainer.GetIndexedTagName(i);
        string nameText = base.SubmeshContainer.GetNamedTag(submeshName);
        if (rowParity)
          output.Print("<tr bgcolor=#0E2A35>");
        else
          output.Print("<tr bgcolor=#05171E>");

        output.Print("<td>");
        output.Print(HTMLWindow.CheckBox("live://toggle-submesh/" + (string)i, submeshState[i]));
        output.Print(" " + nameText);
        output.Print("</td>");
        
        output.Print("</tr>");
      }
      output.Print("</table>");
    }

    output.Print("</body></html>");

    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    return "<kuid:414976:100362>";
  }

  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://toggle-submesh/"))
    {
      string command = cmd["live://toggle-submesh/".size(),];
      if(command)
      {
        int targetMesh = Str.ToInt(command);
        string meshName = base.SubmeshContainer.GetIndexedTagName(targetMesh);

        submeshState[targetMesh] = !submeshState[targetMesh];
        base.self.SetMeshVisible(meshName, submeshState[targetMesh], 0.0);
      }
    }

    base.RefreshBrowser();
  }
};