# VAIL Desktop Application

## Installaing dependencies

Run `python -m pip -r requirements.txt` to install all required modules.

## Running in devolopment mode

You may simply run the `main.py` file with `python main.py`

## Building

This was built using Python 3.12.7 (and 3.10.10 too).

You will need to install the python module called `pyinstaller`, this bundles the application into an executable.

`pip install pyinstaller`

You can then invoke the module by either doing `pyinstaller` or `python -m pyinstaller`, it will vary depending on how your python installation handles it.

Doing `pyinstaller VAIL.spec` should build the application, but additionally you can run the full command

```console
pyinstaller --noconfirm --onefile --windowed --icon "../assets/vailIco.ico" --name "VAIL" --add-data "../assets;assets/"  main.py
```

The resulting application should appear in `./dist`