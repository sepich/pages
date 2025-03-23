---
title: IrfanView msi package for GPO deployment
date: '2011-09-09T11:07:00.002+04:00'
tags:
- windows
- msi
modified: '2011-09-09T11:07:55.801+04:00'
thumbnail: /assets/img/2011/irfan.jpg
url: /2011/09/irfanview-msi-package-for-gpo.html
---
This is a custom **msi package of IrfanView v4.30** with some plugins for mass deployment in AD by Group Policy. 
![](/assets/img/2011/irfan.jpg)  

Customizations from original version:
- Auto file association only for images
- Installs additional plugins only for following image types:
```
Postscript.dll, Jpg_transform.dll, IPTC.dll, Formats.dll, Exif.dll, ImPDF.dll, JPEG2000.dll, Mrc.dll, Hdp.dll, Awd.dll, Wbz.dll, Riot.dll, Lcms.dll, Ecw.dll, Jpeg_LS.dll, Jpm.dll, Wsq.dll, Crw.dll, Exr.dll, Sff.dll, Lwf.dll, Ldf.dll, Ics.dll, Fpx.dll, DjVu.dll, B3d.dll, Dicom.dll, Vtf.dll, Pngout.dll, Icons.dll, EAFSH.dll, LogoManager.dll, Photocd.dll, KDC120.dll
```
- Custom `icons.dll` for file types icons in explorer (No red dead cat anymore! :)
- Leila 16x16 toolbar icons
- Removes old folder `%ProgramFiles%\IrfanView`
- Removes old link folder or shortcut `%StartMenu%\IrfanView(.lnk)` 
- No desktop shortcut, only one at `%StartMenu%\IrfanView.lnk`

If you don't want to distribute it by GPO, just simple silent install from command prompt - use example commands:   
`msiexec /i \\server\path\IrfanView.msi /passive`  
will give you only progressbar without Cancel button  
`msiexec /i \\server\path\IrfanView.msi /quiet`  
totally silent install

[Download IrfanView.msi](http://ge.tt/9Zraga7)
[How to](/2011/09/howto-cook-custom-firefox-msi-for-enterprise-deployment.html) do it yourself
