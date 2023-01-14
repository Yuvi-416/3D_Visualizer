[<p align="center"> <img src="mpi_vtk_js/polls/static/images/Image-In (1).png"/></p>](http://image-in-itn.eu/)

A web-browser-based multidimensional 3D visualizer for confocal and focused-ion beam scanning electron microscopy modalities.
Four visualization modules are available: Volume, Surface, Tri-Planar, and Multi-planar reconstruction.
Our visualizer takes a sequence of images or stacked image files as input and displays them based on the preferences of the user viewer.
For now our visualizer intakes: .dcm, .tif, .tiff, .bmp, .jpg, .mha, .mrc, .nii, .png, .nrrd, .mgh image files as an input.

## Features:
- Volume Rendering (Opacity value slider, Sample distance slider, Blending mode choice, Color choice, Region of intrest clipping slider, Z-dimension scaling)
- Surface Rendering (Opacity value slider, Iso value slider, Color choice, Region of interest clipping slider, Z-dimension scaling)
- Tri-Planar Rendering ((XY, YZ, XZ) slider, Color window and level manipulator, Mouse selector (rotate, pan, zoom options))
- Multi-Planar Reconstruction (Orthoviewer, Separate window for each plane with 3D Image Slice mapper)

## Documentation:
https://github.com/Yuvi-416/3D_Visualizer/wiki/3D-Visualizer-Workflow

## How to use it?
Demo: https://figshare.com/articles/media/3D-Visualizer_Demo/20408103
More can be found here: https://yuvi-416.github.io/3D_Visualizer/

## To host locally:
- Clone this repository, install latest version of python, and install the packages listed in requirement.txt (by pip install -r requirement.txt).
-  Open the terminal, enter in the folder mpi_vtk_js, and launch the server locally by passing the following command over there: python manage.py runserver
- And click the localhost link: http://127.0.0.1:8000/

## Don't want to host?
If you don't want to host it locally, then copy and paste provided link in any web-browser to use our visualizer.
https://yuvi.pythonanywhere.com/

## Third-Party Software's:
- ITK.js
- VTK.js
- jQuery
- Bootstrap
- Django web framework

## Bug and contribution:
- Found bug? please open an issue or want to contribute please fork it and start to contribute.

## Funded:
This work was supported by the Marie Sklodowska Curie ITN-EID, Horizon 2020 project [IMAGE-IN](http://image-in-itn.eu/) (grant agreement No 861122).

## If you use this visualizer in your work then please cite below paper:
- Y. Gupta, R.E. D. Guerrero, C. Costa, R. Jesus, E. Pinho, L. A. B. Silva,, "Interactive Web-based 3D Viewer for Multidimensional Microscope Imaging Modalities," 2022 IEEE  26th International Conference Information Visualisation (IV), 2022, pp. 385-390.
- Gupta Y, Costa C, Pinho E, A. Bastião Silva L, Heintzmann R (2022) IMAGE-IN: Interactive web-based multidimensional 3D visualizer for multi-modal microscopy images. PLOS ONE 17(12): e0279825. https://doi.org/10.1371/journal.pone.0279825

## License:
This project is under MIT license.

