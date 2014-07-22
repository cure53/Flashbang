Flashbang
=========

Welcome to project "Flashbang". This tool is an open-source Flash-security helper with a very specific purpose:
Find the flashVars of a naked SWF and display them so a security tester can start hacking away without decompiling the code.

Flashbang is built upon Mozilla's Shumway project. It runs in the browser but has a bunch of requirements. See link below.

How To Run It?
=====

Flashbang is still in alpha stadium so things might be a bit edgy there and where. Here's how to setup and run Flashbang (no worries, it takes about 5 minutes to get it running):

+ Clone the repo using the `--recursive` flag, so that all necessary submodules are cloned as well
+ Ideally clone it into an Apache web-root (or any other web server)
+ Prepare the environment for Shumway to work properly [Instructions](https://github.com/cure53/Flashbang/wiki/Environment-Setup).
+ Visit the URL `Flashbang/src/flashbang.html` in Chrome (Firefox has a bug right now, we're on it).
+ Console to logging is enabled by default. So ideally keep developer tools open.
+ Run a file by clicking "Open SWF"
+ Flashbang will then show you the flashVars and you can start testing for XSS or alike

Testing
=====

To play with Flashbang you need Flash files. Obviously. 
If you don't have any at hands right now, we can offer you a fine selection of vulnerable files right here:

https://github.com/cure53/Flashbang/tree/master/flash-files/files

Bugs
=====

Flashbang is very young and basically alpha-level software. And finding flashVars in an SWF has proven to be quite hard. So please don't be disappointed it Flashbang isn't yet working for each and any SWF file out there. If you have a SWF where Flashbang doesn't see the flashVars please file a bug and send us some info. We'll try to fix it asap.

Credits
=====

Flashbang was specified and sponsored by Cure53, built by Bharadwaj Machiraju - the Cure53 summer intern and wouldn't exist without the help of Mozilla Research and their amazing Shumway project. Now here's some links you can click:

 * https://cure53.de/
 * https://github.com/tunnelshade
 * https://www.mozilla.org/en-US/research/
 * http://mozilla.github.io/shumway/
