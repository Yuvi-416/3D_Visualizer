# task_2
3D visualizer to visualize CLSM and FIB-SEM microsocpe imaging modalities

Here, we have built an web-browser based multidimensional 3D visualizer to visualize confoacl and focused-ion beam scanning electron microsocpe modalities.
We have proposed four viewer: Volume, Surface, Tri-Planar, and Multiplanar reconstruction.
As an input our visualizer intake sequence of DICOM standard files and render them based on the user choice.

Features:
- Volume Rendering (Opacity value slider, Sample distance slider, Blending mode choice, Color choice)
- Surface Rendering (Opacity value slider, Iso value slider, Color choice)
- Tri-Planar Rendering ((XY, YZ, XZ) slider, Color window and level manipulator, Mouse selector (rotate, pan, zoom options))
- MultiPlanar Reconstruction (Orthoviewer, Separate window for each plane with 3D Image Slice mapper)

Quick Start:
If you don't want to host it locally, then copy and paste below link in any web-browser to use our visualizer.
https://yuvi.pythonanywhere.com/

To host locally:
- Clone this repository and install the package list which is provided in requirement.txt.
- As this visualizer is using django web framework as an backend, therefore, after package installation, you need to pass: python manage.py migrate
after the files are migrated then you can run the server locally by passing: python manage.py runserver
And click the localhost link: http://127.0.0.1:8000/

Third-Party Softwares:
- ITK.JS
- VTK.JS
- jQuery
- Bootstrap
- Django web framework

Funded:
This work was supported by the Marie Sklodowska Curie ITN-EID, Horizon 2020 project IMAGE-IN (grant agreement No 861122).

If you use this visualizer in your work then please cite below paper:
- Y. Gupta, R.E. D. Guerrero, C. Costa, R. Jesus, E. Pinho, L. A. B. Silva,, "Interactive Web-based 3D Viewer for Multidimensional Microscope Imaging Modalities," 2022 IEEE  26th International Conference Information Visualisation (IV), 2022, pp. 385-390.
