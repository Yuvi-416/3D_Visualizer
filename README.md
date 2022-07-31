[<p align="center"> <img src="mpi_vtk_js/polls/static/images/Image-In (1).png"/></p>](http://image-in-itn.eu/)

A web-browser-based multidimensional 3D visualizer for confocal and focused-ion beam scanning electron microscopy modalities.
Four viewers have been created: Volume, Surface, Tri-Planar, and Multi-planar reconstruction.
Our visualizer takes a sequence of DICOM standard files as input and renders them based on the user viewer's choice.

## Features:
- Volume Rendering (Opacity value slider, Sample distance slider, Blending mode choice, Color choice, Region clipping slider)
- Surface Rendering (Opacity value slider, Iso value slider, Color choice, Region clipping slider)
- Tri-Planar Rendering ((XY, YZ, XZ) slider, Color window and level manipulator, Mouse selector (rotate, pan, zoom options))
- Multi-Planar Reconstruction (Orthoviewer, Separate window for each plane with 3D Image Slice mapper)

## How to use it?
See here: https://yuvi-416.github.io/3D_Visualizer/

## To host locally:
- Clone this repository and install the packages listed in requirement.txt.
- Open the terminal, CD the folder where manage.py exists, and launch the server locally by passing the following command over there: python manage.py runserver
- And click the localhost link: http://127.0.0.1:8000/

## Don't want to host?:
If you don't want to host it locally, then copy and paste provided link in any web-browser to use our visualizer.
https://yuvi.pythonanywhere.com/

## Third-Party Software's:
- ITK.js
- VTK.js
- jQuery
- Bootstrap
- Django web framework

## Bug and contribution
- Found bug? please open an issue or want to contribute please fork it and start to contribute.

## Funded:
This work was supported by the Marie Sklodowska Curie ITN-EID, Horizon 2020 project [IMAGE-IN](http://image-in-itn.eu/) (grant agreement No 861122).

## If you use this visualizer in your work then please cite below paper:
- Y. Gupta, R.E. D. Guerrero, C. Costa, R. Jesus, E. Pinho, L. A. B. Silva,, "Interactive Web-based 3D Viewer for Multidimensional Microscope Imaging Modalities," 2022 IEEE  26th International Conference Information Visualisation (IV), 2022, pp. 385-390.

## License:
IMAGE-IN is under MIT license.

