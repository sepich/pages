---
title: SynNotes - notes and code snippet manager
date: '2015-02-23T14:27:00.000+03:00'
tags:
- syn
- windows
modified: '2015-04-19T14:32:19.772+03:00'
thumbnail:
url: /2015/02/synnotes-notes-and-code-snippet-manager.html
---

If you know what for those programs are:
- OneNote
- ResophNotes 
- SynTree
- CherryTree
- Evernote
- Google Notebook(dead)
- Zoho Notes

Then maybe you would be interested in this post. I've tried all of those apps, and used some of them for couple of years. Mostly it is for code snippets, but sometime for note taking too. That's why I wanted code syntax highlighting and ability to quickly hide and show app by hotkey. Unfortunately I was not able to find app solving both items.
That's how [SynTree](/2006/11/syntree-v05-coders-sourcebook.html) was born back in 2006. As time goes by, new idea of syncing everything to cloud come and [simplenote.com](http://simplenote.com/) API released for developers. I'd like the idea and thought to add it's support to `SynTree`, but it was written in `Delphi 6` and stored all data in memory. As my notes counted megabytes already, I was too lazy to search for old `Delphi IDE` as already have free Visual Studio installed, so decided to rewrite everything from scratch in `C#` and use `sqlite` to not limit notes size.
Meet `SynNotes` - simple syntax highlighted Notes manager with incremental full-text search and GMail-like tags as folders. Most of the time app basically hides in the system tray. Then you push global hotkey, and it appears with last Note opened and Search field  already focused. After you found data needed, hide the app back by pressing <kbd>ESC</kbd>.
![](/assets/img/2015/sn1.png)
![](/assets/img/2015/sn2.png)

When you have some notes created - you probably would like to sync them to other your workstations/mobile devices. Also, versioning and  cloud backups would be nice. All that provided if you enable sync with your [Simplenote](http://simplenote.com/) account  

#### Used
- C# (XP users should have [.Net4.0](https://www.microsoft.com/en-US/download/details.aspx?id=17851) installed)
- [Scintilla.NET](http://scintillanet.codeplex.com/)
- [System.Data.SQLite](http://system.data.sqlite.org/index.html/doc/trunk/www/index.wiki)
- [ObjectListView](http://objectlistview.sourceforge.net/cs/index.html)
- [Simplenote](http://simplenote.com/)

#### Download
You can download compiled binaries at [Github](https://github.com/sepich/SynNotes/releases)

#### Installation
Just unpack and use. App does not use registry and tries to keep db and ini-file config alongside with exe file. If app dir is not writable  (you unpacked it to `%ProgramFiles%`) then `%AppData%\SynNotes` directory used instead.

#### Configuration
That is very simple app and it will be so. No bells'n'whistles for reduced memory footprint. 

#### Sync
Simplenote sync is configured when you first press `Sync` button:
![](/assets/img/2015/sn3.png)  
Or at any time by Right-Clicking of that button. No any data exchange is performed when `Sync Frequency` set to `Manual` until you press the `Sync` button.

#### Settings
Some configuration could be done by editing `settings.ini`.
This part is for `Global Hotkeys` . Default is <kbd>Win</kbd>+<kbd>~</kbd> for Search, and no Hotkey assigned to just show app
```ini
[Keys]
HotkeyShow=
HotkeySearch=Win+`
```
App support themes of [Notepad++](http://notepad-plus-plus.org/) format which are stored in `/themes` folder. So, you can edit them or create new with visual editor of NP++. Then enable it like this:
```ini
[Scintilla]
Theme=Visual Studio Dark.xml
```

#### Lexers
- When Note has no explicit Lexer (language to highlight syntax) selected it will inherit it from it's tags. 
- If Note has multiple tags assigned, privilege has Tag which is  higher in tree (you can arrange tags by drag'n'drop) In this case name  of Lexer would be prefixed by `^`
- If both Note and all it's Tags has no Lexer assigned `bash` is used by default
