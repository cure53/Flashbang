Flashbang
=========

Welcome to project "Flashbang". This tool is an open-source Flash-security helper with a very specific purpose:
Find the flashVars of a naked SWF and display them so a security tester can start hacking away without decompiling the code.

Flashbang is built upon Mozilla's Shumway project. It runs entirely in the browser.

How To Run It?
=====

Flashbang is still in alpha stadium so things might be a bit edgy there and where. Here's how to setup and run Flashbang:

+ Clone the repo using a `--recursive` flag, so that all necessary submodules are cloned as well
+ Ideally clone it into an Apache web-root (or any other web server)
+ Prepare the environment for Shumway to work properly [Instructions](https://github.com/cure53/Flashbang/wiki/Environment-Setup).
+ Visit the URL `Flashbang/src/flashbang.html` in Chrome (Firefox has a bug right now, we're on it).
+ Console to logging is enabled by default. So ideally keep developer tools open.
+ Run a file by clicking "Open SWF"
+ Flashbang will then show you the flashVars and you can start testing for XSS or alike
