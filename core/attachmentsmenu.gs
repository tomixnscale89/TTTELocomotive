include "tttemenu.gs"
include "assetbrowser.gs"
include "meshinspector.gs"

class AttachmentsMenu isclass CustomScriptMenu
{
  public bool IsCore() { return true; }

  float[] attachmentPosX;
  float[] attachmentPosY;
  float[] attachmentPosZ;
  
  float[] attachmentRotX;
  float[] attachmentRotY;
  float[] attachmentRotZ;

  AssetBrowser m_assetBrowser;
  int m_selectingAttachment;

  MeshInspector m_inspector;
  int m_inspectingAttachment;

  public void Init()
  {
    m_selectingAttachment = -1;
    m_inspectingAttachment = -1;

    attachmentPosX = new float[base.MeshAttachments.size()];
    attachmentPosY = new float[base.MeshAttachments.size()];
    attachmentPosZ = new float[base.MeshAttachments.size()];

    attachmentRotX = new float[base.MeshAttachments.size()];
    attachmentRotY = new float[base.MeshAttachments.size()];
    attachmentRotZ = new float[base.MeshAttachments.size()];
  }

  void CreateAssetBrowser()
  {
    m_assetBrowser = new AssetBrowser();
    m_assetBrowser.Init(base.self.GetAsset(), base.self, "CustomScriptMessage");
  }

  void CreateAttachmentInspector(int iAtt)
  {
    if (m_inspector)
    {
      m_inspector.Close();
      m_inspector = null;
    }

    if (m_inspectingAttachment == iAtt)
    {
      m_inspectingAttachment = -1;
      return;
    }

    string att = base.MeshAttachments[iAtt];
    MeshObject mesh = base.self.GetFXAttachment(att);
    if (!mesh)
      return;
    
    m_inspector = new MeshInspector();
    m_inspector.Init(mesh, base.self);
    m_inspectingAttachment = iAtt;
  }

  void SetAttachmentTransforms()
  {
    int i;
    for (i = 0; i < base.MeshAttachments.size(); i++)
    {
      base.popup.SetElementProperty("att-pos-x-" + (string)i, "value", (string)attachmentPosX[i]);
      base.popup.SetElementProperty("att-pos-y-" + (string)i, "value", (string)attachmentPosY[i]);
      base.popup.SetElementProperty("att-pos-z-" + (string)i, "value", (string)attachmentPosZ[i]);

      base.popup.SetElementProperty("att-rot-x-" + (string)i, "value", (string)attachmentRotX[i]);
      base.popup.SetElementProperty("att-rot-y-" + (string)i, "value", (string)attachmentRotY[i]);
      base.popup.SetElementProperty("att-rot-z-" + (string)i, "value", (string)attachmentRotZ[i]);
    }
  }

  void UpdateAttachmentTransforms()
  {
    string[] attachments = base.MeshAttachments;

    int i;
    for (i = 0; i < base.MeshAttachments.size(); i++)
    {
      string att = attachments[i];
      MeshObject mesh = base.self.GetFXAttachment(att);
      if (!mesh)
        continue;
      
      attachmentPosX[i] = Str.ToFloat(base.popup.GetElementProperty("att-pos-x-" + (string)i, "value"));
      attachmentPosY[i] = Str.ToFloat(base.popup.GetElementProperty("att-pos-y-" + (string)i, "value"));
      attachmentPosZ[i] = Str.ToFloat(base.popup.GetElementProperty("att-pos-z-" + (string)i, "value"));

      attachmentRotX[i] = Str.ToFloat(base.popup.GetElementProperty("att-rot-x-" + (string)i, "value"));
      attachmentRotY[i] = Str.ToFloat(base.popup.GetElementProperty("att-rot-y-" + (string)i, "value"));
      attachmentRotZ[i] = Str.ToFloat(base.popup.GetElementProperty("att-rot-z-" + (string)i, "value"));

      mesh.SetMeshTranslation("default", attachmentPosX[i], attachmentPosY[i], attachmentPosZ[i]);
      mesh.SetMeshOrientation("default", attachmentRotX[i], attachmentRotY[i], attachmentRotZ[i]);
    }
  }

  void ResetAttachment(int iAtt)
  {
    attachmentPosX[iAtt] = 0;
    attachmentPosY[iAtt] = 0;
    attachmentPosZ[iAtt] = 0;

    attachmentRotX[iAtt] = 0;
    attachmentRotY[iAtt] = 0;
    attachmentRotZ[iAtt] = 0;

    SetAttachmentTransforms();
    UpdateAttachmentTransforms();
  }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    string[] attachments = base.MeshAttachments;

    // List queues.
    output.Print("<table cellspacing=2>");
    output.Print("<tr> <td width='300'></td> </tr>");
    bool rowParity = false;
    string rowcolor;
    int i;
    for (i = 0; i < attachments.size(); i++)
    {
      if (rowParity) rowcolor = Colors.Primary; else rowcolor = Colors.PrimaryDark;
      rowParity = !rowParity;
      output.Print("<tr bgcolor=" + rowcolor + "><td>");
      string att = attachments[i];

      output.Print("<a href='live://select-attachment/" + (string)i + "'>");
      output.Print("<h2>" + att + "</h2>");
      output.Print("</a>");

      output.Print("<br>");

      MeshObject mesh = base.self.GetFXAttachment(att);
      if (mesh)
      {
        output.Print("<table>");

        // output.Print("<tr> <td width='296'></td> </tr>");

        Asset meshAsset = mesh.GetAsset();
        if (meshAsset)
        {
          output.Print("<tr><td>");
          output.Print("<h3>" + meshAsset.GetLocalisedName() + "</h3>");
          output.Print("</td></tr>");
        }

        output.Print("<tr>");
        output.Print("<td>");

        output.Print("<table><tr>");
        output.Print("<td>");
        output.Print("<a href='live://attachment-properties/" + (string)i + "'><label>Properties</label></a>");
        output.Print("</td>");

        output.Print("<td>");
        output.Print("<a href='live://attachment-reset/" + (string)i + "'><label>Reset</label></a>");
        output.Print("</td>");

        output.Print("<td>");
        output.Print("<a href='live://attachment-clear/" + (string)i + "'><label>Clear</label></a>");
        output.Print("</td>");
        output.Print("</tr></table>");

        output.Print("</td>");
        output.Print("</tr>");

        output.Print("<tr><td>");
        output.Print("<label>Position X/Y/Z:</label>");
        output.Print("</td></tr>");
        
        output.Print("<tr><td>");
        output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='att-pos-x-" + (string)i + "' min=-2.0 max=2.0 value=" + (string)attachmentPosX[i] + " page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("</td></tr>");

        output.Print("<tr><td>");
        output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='att-pos-y-" + (string)i + "' min=-2.0 max=2.0 value=" + (string)attachmentPosY[i] + " page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("</td></tr>");

        output.Print("<tr><td>");
        output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='att-pos-z-" + (string)i + "' min=-2.0 max=2.0 value=" + (string)attachmentPosZ[i] + " page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("</td></tr>");

        output.Print("<tr><td>");
        output.Print("<label>Orientation RX/RY/RZ:</label>");
        output.Print("</td></tr>");

        output.Print("<tr><td>");
        output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='att-rot-x-" + (string)i + "' min=-3.14 max=3.14 value=" + (string)attachmentRotX[i] + " page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("</td></tr>");

        output.Print("<tr><td>");
        output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='att-rot-y-" + (string)i + "' min=-3.14 max=3.14 value=" + (string)attachmentRotY[i] + " page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("</td></tr>");

        output.Print("<tr><td>");
        output.Print("<trainz-object style=slider horizontal theme=ttte-slider width=100% height=32 id='att-rot-z-" + (string)i + "' min=-3.14 max=3.14 value=" + (string)attachmentRotZ[i] + " page-size=0.001 draw-marks=0 draw-lines=0></trainz-object>");
        output.Print("</td></tr>");
        
        output.Print("</table>");
      }


      output.Print("</td></tr>");
    }
    output.Print("</table>");

    output.Print("</body></html>");
    return output.AsString();
  }

  public void PostRefresh()
  {
    SetAttachmentTransforms();
  }

  public float GetTickInterval()
  {
    return 0.01;
  }

  public void Tick()
  {
    UpdateAttachmentTransforms();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:103722>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 26;
  }

  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://select-attachment/"))
    {
      string command = cmd["live://select-attachment/".size(),];
      if(command)
      {
        m_selectingAttachment = Str.ToInt(command);
        CreateAssetBrowser();
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://attachment-properties/"))
    {
      string command = cmd["live://attachment-properties/".size(),];
      if(command)
      {
        int iAtt = Str.ToInt(command);
        CreateAttachmentInspector(iAtt);
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://attachment-reset/"))
    {
      string command = cmd["live://attachment-reset/".size(),];
      if(command)
      {
        int iAtt = Str.ToInt(command);
        ResetAttachment(iAtt);
      }
    }
    else if(TrainUtil.HasPrefix(cmd, "live://attachment-clear/"))
    {
      string command = cmd["live://attachment-clear/".size(),];
      if(command)
      {
        string att = base.MeshAttachments[Str.ToInt(command)];
        base.self.SetFXAttachment(att, null);
      }
    }

    base.RefreshBrowser();
  }

  public void CustomScriptMessage(Message msg)
  {
    if (msg and msg.src == m_assetBrowser)
    {
      if (msg.minor == "AssetBrowserSelect")
      {
        Asset asset = m_assetBrowser.GetSelectedAsset();
        if (m_selectingAttachment != -1)
        {
          string att = base.MeshAttachments[m_selectingAttachment];
          base.self.SetFXAttachment(att, asset);
          m_selectingAttachment = -1;
        }
        m_assetBrowser.Close();
        m_assetBrowser = null;

        base.RefreshBrowser();
      }
    }
  }
};