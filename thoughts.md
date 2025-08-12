ok, i removed the old files and added in the new files, i think that one of the markdown files has the dir struct, READEME.md i believe has it, since the project area does not support directory structure.   ... I need to take the time tonight to update those README files, README.md and README-apps.md

so a question, we had this is a previous version but i know it means modifying preload and main js files, but, and this is after the AI drawer, can we have the app scan a folder on the user's drive, and load up web files?

in an earlier version, i had a folder named "Widgets" i think, i may be wrong on that,  but the start launcher scanned the folder, found sub folders, each sub folderhad like an information json, always the same name, an index.html, main.js, style.css, and other files, and basically they were loaded in to a window manager window and they had these mini apps now.  

i don't have any of the old code on this laptop, so that's why i am just discussing it, when i get to the house tonight, the code form the version 2 of what we call nebuladesktop has this and i am wondering about integrating it, that way, anyone can make a 'Nebula App' in html, js, css, etc, and run and use it in nebula.

also, debating making a specific repo, a Nebula App Store, like we can make a store window that lists 'Nebula Apps' and they can either download the app to the folder that gets scanned, OR, we can link the app as online only, and when i it is launched from the nebula launcher, it loads up the app online...

again, this is just me thinking outloud, it's actually a very ChromeOS type of thing i think, and it may be useful, or not, feel free to let me know wahat you think.

about the AI Drawer, the shoelace autoload script has never worked well for me, so we may need to declare individual components in the index file.  

ok, i am through rambling, what do you think?  and you don't have to worry about me agreeing or disagreeing with you, i appreciate honest input, even if it goes against what i am currently thinking.

how about this, the Assistant panel is the full height - taskbar of the electron app, and we make a Pin button, and a "2x width" idk what to call this button, but clicking this makes the panel 1/3rd of the avaloable width, and click it again return it to it's normal size.  we may need to add in a config somewhere for user choosing 'full view' (i like this name better than the 2x width) where the config can have 1/4th width, 1/3rd width, 1/2 width, and clicking that 'full view' button toggles between the current default size and the larger size.  and the pin button will be super useful espeially for the full view.  that way we don't have to fight with resize handles, drag, etc.  for most people, a big menu to the left hand side is muscle memory due to windows 95 to windows 10.