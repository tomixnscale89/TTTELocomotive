include "tttemenu.gs"


class LoadsMenu isclass CustomScriptMenu
{
  int m_selectedQueue;

  public bool IsCore() { return true; }

  public void Init()
  {
    m_selectedQueue = -1;
  }

  public string GetMenuHTML()
  {
    HTMLBuffer output = HTMLBufferStatic.Construct();
    output.Print("<html><body>");

    ProductQueue[] queues = base.self.GetQueues();

    // List queues.
    output.Print("<table>");
    output.Print("<tr> <td width='300'></td> </tr>");
    bool rowParity = false;
    string rowcolor;
    int i;
    for (i = 0; i < queues.size(); i++)
    {
      if (rowParity) rowcolor = Colors.Primary; else rowcolor = Colors.PrimaryDark;
      rowParity = !rowParity;
      output.Print("<tr bgcolor=" + rowcolor + "><td>");
      ProductQueue queue = queues[i];

      output.Print("<a href='live://select-queue/" + (string)i + "'>");
      output.Print(queue.GetQueueName());
      output.Print("</a>");

      output.Print("</td></tr>");
    }
    output.Print("</table>");

    if (m_selectedQueue != -1)
    {
      ProductQueue queue = queues[m_selectedQueue];
      ProductFilter filter = queue.GetProductFilter();
      if (filter)
      {
        // TODO: Allow all products button (SetProductFilter)
        Asset[] filterAssets = filter.GetProducts();

        output.Print("<table>");
        output.Print("<tr> <td width='300'></td> <td></td> </tr>");
        rowParity = false;
        for (i = 0; i < filterAssets.size(); i++)
        {
          if (rowParity) rowcolor = Colors.Primary; else rowcolor = Colors.PrimaryDark;
          rowParity = !rowParity;
          output.Print("<tr bgcolor=" + rowcolor + ">");

          output.Print("<td>");
          output.Print(filterAssets[i].GetLocalisedName());
          output.Print("</td>");

          output.Print("<td>");
          output.Print("<trainz-object width=64 height=64 style=preview asset='" + filterAssets[i].GetKUID().GetLogString() + "'></trainz-object>");
          output.Print("</td>");
  
          output.Print("</tr>");
        }
        output.Print("</table>");
      }
      // else
      // {
      //   Asset[] queueAssets = queue.GetProductList();

      //   output.Print("<table>");
      //   output.Print("<tr> <td width='300'></td> </tr>");
      //   rowParity = false;
      //   for (i = 0; i < queueAssets.size(); i++)
      //   {
      //     if (rowParity) rowcolor = Colors.Primary; else rowcolor = Colors.PrimaryDark;
      //     output.Print("<tr bgcolor=" + rowcolor + "><td>");
  
      //     output.Print(queueAssets[i].GetLocalisedName());
  
      //     output.Print("</td></tr>");
      //   }
      //   output.Print("</table>");
      // }

    }

    output.Print("</body></html>");
    return output.AsString();
  }

  public string GetIconKUIDString()
  {
    // return "<kuid:414976:103374>";
    return "<kuid:414976:103758>";
  }

  public int GetIconTextureIndex()
  {
    return 13;
  }
  
  public void ProcessMessage(string cmd)
  {
    if(TrainUtil.HasPrefix(cmd, "live://select-queue/"))
    {
      string command = cmd["live://select-queue/".size(),];
      if(command)
      {
        m_selectedQueue = Str.ToInt(command);
      }
    }

    base.RefreshBrowser();
  }
};