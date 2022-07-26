/// Input conversion ////
/// ITK to VTK Conversion and vice-versa////
/////////////////////////////////////////////////
const { vtkErrorMacro } = vtk.macro;
// see itk.js/PixelTypes.js
const ITKPixelTypes = {
  Unknown: 0,
  Scalar: 1,
  RGB: 2,
  RGBA: 3,
  Offset: 4,
  Vector: 5,
  Point: 6,
  CovariantVector: 7,
  SymmetricSecondRankTensor: 8,
  DiffusionTensor3D: 9,
  Complex: 10,
  FixedArray: 11,
  Array: 12,
  Matrix: 13,
  VariableLengthVector: 14,
  VariableSizeMatrix: 15,
};

/**
 * Converts an itk.js image to a vtk.js image.
 *
 * Requires an itk.js image as input.
 */

function convertItkToVtkImage(itkImage, options = {}) {
  const vtkImage = {
    origin: [0, 0, 0],
    spacing: [1, 1, 1],
  };

  const dimensions = [1, 1, 1];
  const direction = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  for (let idx = 0; idx < itkImage.imageType.dimension; ++idx) {
    vtkImage.origin[idx] = itkImage.origin[idx];
    vtkImage.spacing[idx] = itkImage.spacing[idx];
    dimensions[idx] = itkImage.size[idx];
    for (let col = 0; col < itkImage.imageType.dimension; ++col) {
      // ITK (and VTKMath) use a row-major index axis, but the direction
      // matrix on the vtkImageData is a webGL matrix, which uses a
      // column-major data layout. Transpose the direction matrix from
      // itkImage when instantiating that vtkImageData direction matrix.
      direction[col + idx * 3] =
        itkImage.direction.data[idx + col * itkImage.imageType.dimension];
    }
  }

  // Create VTK Image Data
//  const actor = vtk.Rendering.Core.vtkActor.newInstance();
  const imageData = vtk.Common.DataModel.vtkImageData.newInstance(vtkImage);

  // Create VTK point data -- the data associated with the pixels / voxels
  const pointData = vtk.Common.Core.vtkDataArray.newInstance({
    name: options.scalarArrayName || 'Scalars',
    values: itkImage.data,
    numberOfComponents: itkImage.imageType.components,
  });

  imageData.setDirection(direction);
  imageData.setDimensions(...dimensions);
  // Always associate multi-component pixel types with vtk.js point data
  // scalars to facilitate multi-component volume rendering
  imageData.getPointData().setScalars(pointData);

  // Associate the point data that are 3D vectors / tensors
  // Refer to itk-js/src/PixelTypes.js for numerical values
  switch (itkImage.imageType.pixelType) {
    case ITKPixelTypes.Scalar:
      break;
    case ITKPixelTypes.RGB:
      break;
    case ITKPixelTypes.RGBA:
      break;
    case ITKPixelTypes.Offset:
      break;
    case ITKPixelTypes.Vector:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 3
      ) {
        imageData.getPointData().setVectors(pointData);
      }
      break;
    case ITKPixelTypes.Point:
      break;
    case ITKPixelTypes.CovariantVector:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 3
      ) {
        imageData.getPointData().setVectors(pointData);
      }
      break;
    case ITKPixelTypes.SymmetricSecondRankTensor:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 6
      ) {
        imageData.getPointData().setTensors(pointData);
      }
      break;
    case ITKPixelTypes.DiffusionTensor3D:
      if (
        itkImage.imageType.dimension === 3 &&
        itkImage.imageType.components === 6
      ) {
        imageData.getPointData().setTensors(pointData);
      }
      break;
    case ITKPixelTypes.Complex:
      break;
    case ITKPixelTypes.FixedArray:
      break;
    case ITKPixelTypes.Array:
      break;
    case ITKPixelTypes.Matrix:
      break;
    case ITKPixelTypes.VariableLengthVector:
      break;
    case ITKPixelTypes.VariableSizeMatrix:
      break;
    default:
      vtkErrorMacro(
        `Cannot handle unexpected ITK.js pixel type ${itkImage.imageType.pixelType}`
      );
      return null;
  }

  return imageData;
}

const vtkArrayTypeToItkComponentType = new Map([
  ['Uint8Array', 'uint8_t'],
  ['Int8Array', 'int8_t'],
  ['Uint16Array', 'uint16_t'],
  ['Int16Array', 'int16_t'],
  ['Uint32Array', 'uint32_t'],
  ['Int32Array', 'int32_t'],
  ['Float32Array', 'float'],
  ['Float64Array', 'double'],
]);

/**
 * Converts a vtk.js image to an itk.js image.
 *
 * Requires a vtk.js image as input.
 */
function convertVtkToItkImage(vtkImage, copyData = false) {
  const itkImage = {
    imageType: {
      dimension: 3,
      pixelType: ITKPixelTypes.Scalar,
      componentType: '',
      components: 1,
    },
    name: 'name',
    origin: vtkImage.getOrigin(),
    spacing: vtkImage.getSpacing(),
    direction: {
      data: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    },
    size: vtkImage.getDimensions(),
  };

  const direction = vtkImage.getDirection();

  const dimension = itkImage.size.length;
  itkImage.imageType.dimension = dimension;
  itkImage.direction.rows = dimension;
  itkImage.direction.columns = dimension;

  // Transpose the direction matrix from column-major to row-major
  for (let idx = 0; idx < dimension; ++idx) {
    for (let idy = 0; idy < dimension; ++idy) {
      itkImage.direction.data[idx + idy * dimension] =
        direction[idy + idx * dimension];
    }
  }

  const pointData = vtkImage.getPointData();

  let vtkArray;
  if (pointData.getTensors() !== null) {
    itkImage.imageType.pixelType = ITKPixelTypes.DiffusionTensor3D;
    vtkArray = pointData.getTensors();
  } else if (pointData.getVectors() != null) {
    itkImage.imageType.pixelType = ITKPixelTypes.Vector;
    vtkArray = pointData.getVectors();
  } else {
    vtkArray = pointData.getScalars();
  }

  itkImage.imageType.componentType = vtkArrayTypeToItkComponentType.get(
    vtkArray.getDataType()
  );

  if (copyData) {
    // Copy the data array
    itkImage.data = vtkArray.getData().slice(0);
  } else {
    itkImage.data = vtkArray.getData();
  }

  return itkImage;
}

/////////////////////////////////////////////////////////////////////////////////////////
// Volume Rendering by Yubraj Gupta////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
function volume_rendering(volume_imageData, volume_color_val){

// 2. Get the data scalar range to set the first ISO value
var container = document.getElementById('viewContainer');
const genericRenderWindow = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance();
const openglRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
const renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
const interactorStyle = vtk.Interaction.Style.vtkInteractorStyleTrackballCamera.newInstance();
const interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
const vtkBoundingBox = vtk.Common.DataModel.vtkBoundingBox.newInstance();
const vtkColorMaps = vtk.Rendering.Core.vtkColorTransferFunction.vtkColorMaps;
const vtkColorTransferFunction = vtk.Rendering.Core.vtkColorTransferFunction;
const vtkConvolution2DPass = vtk.Rendering.OpenGL.vtkConvolution2DPass;
const vtkCamera = vtk.Rendering.Core.vtkCamera;
const vtkAnnotatedCubeActor = vtk.Rendering.Core.vtkAnnotatedCubeActor;
const vtkOrientationMarkerWidget = vtk.Interaction.Widgets.vtkOrientationMarkerWidget;
const vtkLight = vtk.Rendering.Core.vtkLight;

const vtkMouseCameraTrackballPanManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballPanManipulator;
const vtkMouseCameraTrackballZoomManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballZoomManipulator;
const vtkInteractorStyleManipulator = vtk.Interaction.Style.vtkInteractorStyleManipulator;
const vtkMouseCameraTrackballRotateManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballRotateManipulator;

openglRenderWindow.setContainer(container);
const { width, height } = container.getBoundingClientRect(); /////////////////////////
openglRenderWindow.setSize(width, height);
openglRenderWindow.setV
renderWindow.addView(openglRenderWindow);

console.log(volume_imageData)
console.log(volume_imageData[0])
console.log(volume_imageData.length)

function updateBlendMode(event) {
  const blendMode = parseInt(event.target.value, 10);
  const ipScalarEls = document.querySelectorAll('.ipScalar');

  volumeMapper.setBlendMode(blendMode);
  volumeMapper.setIpScalarRange(0.0, 1.0);

  // if average or additive blend mode
  if (blendMode === 3 || blendMode === 4) {
    // Show scalar ui
    for (let m = 0; m < ipScalarEls.length; m += 1) {
      const el = ipScalarEls[m];
      el.style.display = 'table-row';
    }
  } else {
    // Hide scalar ui
    for (let m = 0; m < ipScalarEls.length; m += 1) {
      const el = ipScalarEls[m];
      el.style.display = 'none';
    }
  }
  renderWindow.render();
}

function updateScalarMin(event) {
  volumeMapper.setIpScalarRange(event.target.value, volumeMapper.getIpScalarRange()[1]);
  renderWindow.render(); // We use it inside function to react instantly.
}

function updateScalarMax(event) {
  volumeMapper.setIpScalarRange(volumeMapper.getIpScalarRange()[0], event.target.value);
  renderWindow.render(); // We use it inside function to react instantly.
}

function searchvalue(v, colormap){
    // res = colorMaps[ColorMap][v]
    r = colormap[(v * 4) + 1]
    g = colormap[(v * 4) + 2]
    b = colormap[(v * 4) + 3]

    return [r, g, b];
}

const viewColors = [
  [0.0, 0.0, 0.0], // sagittal
  [0.0, 0.0, 0.0], // coronal
  [0.0, 0.0, 0.0], // axial
];

function createRGBStringFromRGBValues(rgb) {
  if (rgb.length !== 3) {
    return 'rgb(0, 0, 0)';
  }
  return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(rgb[2] * 255).toString()})`;
}

function getCenterOfScene (renderer) {
  const bounds = renderer.computeVisiblePropBounds();
  const center = [0, 0, 0];

  center[0] = (bounds[0] + bounds[1]) / 2.0;
  center[1] = (bounds[2] + bounds[3]) / 2.0;
  center[2] = (bounds[4] + bounds[5]) / 2.0;

  return center;
}

const color_maps = volume_color_val;
console.log(color_maps)

volume_opacity_val = []
console.log(volume_opacity_val)
volume_sample_Distance = []
console.log(volume_sample_Distance)
volume_visibility_control = []
console.log(volume_visibility_control)

      for (i = 0; i < volume_imageData.length; i++){
            mycolor = eval(color_maps[i])
            console.log(i)

            volume_vtk = vtk.Rendering.Core.vtkVolume.newInstance();
            volumeMapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();
            volumeProperty = vtk.Rendering.Core.vtkVolumeProperty.newInstance();
            ofun = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
            ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();

            // Load the Input
            const dataArray = volume_imageData[i].getPointData().getScalars() || volume_imageData[i].getPointData().getArrays()[0];
            console.log('dataArray', dataArray)
            const dataRange = dataArray.getRange();
            console.log('dataRange', dataRange)
            dataRange_1 = volume_imageData[i].getPointData().getScalars().getRange();
            console.log('dataRange_1', dataRange_1)

            //dataRange = volume_imageData[i].getPointData().getScalars().getRange();
            dimensions = volume_imageData[i].getDimensions()
            console.log('volume dimensions', dimensions)
            image_origin = volume_imageData[i].getOrigin();
            console.log('image_origin', image_origin)

            // Calculating Pixel range
            ii_0 = parseInt(dataRange[0])
            ii_mid = parseInt(dataRange[1] / 2)
            ii_1 = parseInt(dataRange[1])

            // Define PieceWise transfer function
            ofun.removeAllPoints();
            ofun.addPoint(ii_0, 0.0);
            // ofun.addPoint((ii_0[0] + ii_1[1]) * 0.5, 0.5);
            console.log(ofun);
            ofun.addPoint(ii_1, 1.0);

            // #####################################################################
            min = ii_0;
            console.log(min);
            max = ii_1;
            console.log(max);
            temp = 0

            for (t = min; t <= max; t++){
                    newVal = parseInt(((t-min)/(max-min)) * 255);
                    if (newVal != temp) {
                        // console.log(t);
                        rgb = searchvalue(newVal, mycolor);
                         //print(i, r, g, b)
                        // console.log(rgb[0]);
                        ctfun.addRGBPoint(t, rgb[0], rgb[1], rgb[2])
                        // console.log(temp);
                        temp = temp + 1
                    }
            }

            // Define Volume Property
            volumeProperty.setRGBTransferFunction(0, ctfun);
            volumeProperty.setScalarOpacity(0, ofun);
            volumeProperty.setShade(true); // Increase the lights
            // volumeProperty.setInterpolationTypeToLinear();
            volumeProperty.setInterpolationTypeToFastLinear();
            volumeProperty.setAmbient(0.2);
            volumeProperty.setDiffuse(0.7);
            volumeProperty.setSpecular(0.3);
            volumeProperty.setSpecularPower(8.0); // setSpecularPower(1.0, 1.0, 1.0);
            volumeProperty.setOpacityMode(0, 20);
            volumeProperty.setIndependentComponents(true);
            volumeProperty.setUseGradientOpacity(0, true); // Helps to make image translucent
            volumeProperty.setGradientOpacityMinimumValue(0, 0);
            volumeProperty.setGradientOpacityMinimumOpacity(0, 0);
            // volumeProperty.setGradientOpacityMaximumValue(0, 20);
            volumeProperty.setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.1);
            volumeProperty.setGradientOpacityMaximumOpacity(0, 1.0);

            volumeMapper.setInputData(volume_imageData[i]);
            // volumeMapper.setSampleDistance(0.4);
            volumeMapper.setMaximumSamplesPerRay(true);
            volumeMapper.setAutoAdjustSampleDistances(true);

            // Define vtkVolume
            volume_vtk.setMapper(volumeMapper);
            volume_vtk.setProperty(volumeProperty);

            renderer.addActor(volume_vtk);

//            // ----------------------------------------------------------------------------
//            // Light
//            // ----------------------------------------------------------------------------
//            renderer.removeAllLights();
//            const lightPosition = [image_origin[0] + 0.1, image_origin[1] + 0.1, image_origin[2] + 17.0];
//            const lightFocalPoint = image_origin;
//            const light = vtkLight.newInstance();
//            light.setPosition(lightPosition);
//            light.setPositional(true);
//            light.setLightType('SceneLight');
//            light.setFocalPoint(lightFocalPoint);
//            light.setColor(1, 1, 1);
//            light.setIntensity(1.0);
//            light.setConeAngle(60.0);
//            renderer.addLight(light);

            const axes = vtkAnnotatedCubeActor.newInstance();
            axes.setDefaultStyle({
            text: '+X',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            fontColor: 'white',
            // fontSizeScale: (res) => res / 2,
            faceColor: createRGBStringFromRGBValues(viewColors[0]),
            // faceRotation: 0, //
            edgeThickness: 0.1,
            edgeColor: 'white',
            resolution: 400,
            });
            // axes.setXPlusFaceProperty({ text: '+X' });
            axes.setXMinusFaceProperty({
            text: '-X',
            faceColor: createRGBStringFromRGBValues(viewColors[0]),
            // faceRotation: 90,
            //fontStyle: 'italic',
            });
            axes.setYPlusFaceProperty({
            text: '+Y',
            faceColor: createRGBStringFromRGBValues(viewColors[1]),
            // fontSizeScale: (res) => res / 4,
            });
            axes.setYMinusFaceProperty({
            text: '-Y',
            faceColor: createRGBStringFromRGBValues(viewColors[1]),
            // fontColor: 'white',
            });
            axes.setZPlusFaceProperty({
            text: '+Z',
            faceColor: createRGBStringFromRGBValues(viewColors[2]),
            });
            axes.setZMinusFaceProperty({
            text: '-Z',
            faceColor: createRGBStringFromRGBValues(viewColors[2]),
            // faceRotation: 45,
            });

            // create orientation widget
            orientationWidget = vtkOrientationMarkerWidget.newInstance({actor: axes, interactor: interactor});
            setTimeout(() => {
            // debugger;
            orientationWidget.setEnabled(true);
            orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
            orientationWidget.setViewportSize(0.15);
            orientationWidget.setMinPixelSize(20);
            orientationWidget.setMaxPixelSize(80);
            }, 1);

            window.onresize = () => {orientationWidget.updateViewport();}

            // renderer.resetCamera();
            // renderWindow.render();

            volume_opacity_val[i] = volumeProperty
            volume_sample_Distance[i] = volumeMapper
            volume_visibility_control[i] = volume_vtk
            console.log(volume_visibility_control[i])
      }

    for(e=0; e<volume_imageData.length; e++){

    volume_idOpacity= "#setScalarOpacityUnitDistance"+ e
    volume_idDistance= "#setSampleDistance"+ e
    volume_idblendMode= "#blendMode"+ e
    volume_idVisibility= "#visibility"+ e

    console.log(volume_idOpacity)
    console.log(volume_idDistance)
    d = e
    trigger_changes_volume(volume_idVisibility, volume_visibility_control[d], volume_idOpacity, volume_idDistance, volume_opacity_val[d], volume_sample_Distance[d], renderWindow, volume_idblendMode)
    };

//////////////////////////////////////////////////////////////////////////////////////
const center = getCenterOfScene(renderer);
/////////////////////////////////////////////////////////////////////////////////////
const camera = vtkCamera.newInstance();
// renderer.getActiveCamera();
// prevent zoom manipulator from messing with our focal point
camera.getFocalPoint()
// renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
// renderer.resetCamera();
camera.elevation(70);
// renderWindow.render()
renderWindow.addRenderer(renderer);
// interactor.setDesiredUpdateRate(15.0);
interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(container);
/////////////////////////////////////////////////////////////////////////////////////////////
const PanSelector = vtkMouseCameraTrackballPanManipulator.newInstance({ button: 3 },);
const ZoomSelector = vtkMouseCameraTrackballZoomManipulator.newInstance({ scrollEnabled: true, dragEnabled: false },);
const Rotate = vtkMouseCameraTrackballRotateManipulator.newInstance({ button: 1 },);
// const center = getCenterOfScene(camera.getFocalPoint());
// { button: 2 },
const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addMouseManipulator(PanSelector);
iStyle.addMouseManipulator(ZoomSelector);
iStyle.addMouseManipulator(Rotate);
iStyle.setCenterOfRotation(center);

renderWindow.getInteractor().setInteractorStyle(iStyle);
renderer.resetCamera();
// interactor.setInteractorStyle(interactorStyle);
///////////////////////////////////////////////////////////////////////////////////////////////////////
renderWindow.render()

}

function trigger_changes_volume(volume_idVisibility, volume_visibility_control, volume_idOpacity, volume_idDistance, volume_opacity_val, volume_sample_Distance, renderWindow, volume_idblendMode) {

    // Control Sample Opacity
    $(volume_idOpacity).change(function() {
      newVal= this.value
      // console.log(opacity_val)
       volume_opacity_val.setScalarOpacityUnitDistance(0, newVal); // Helps to adjust transparency of the rendered Image (differs within rendered image)
       renderWindow.render(); // We use it inside function to react instantly.

    });
      // Control Sample Distance
    $(volume_idDistance).change(function() {
      new_Val= this.value
      // console.log(sample_Distance)
       volume_sample_Distance.setSampleDistance(new_Val); // Helps to adjust transparency of the rendered Image (differs within rendered image)
       renderWindow.render(); // We use it inside function to react instantly.

    });
    // Control Blending Mode
    $( volume_idblendMode ).change(function() {
        new_Val= parseInt(this.value, 10);
        volume_sample_Distance.setBlendMode(new_Val);
        // sample_Distance.setIpScalarRange(0.0, 1.0);
        renderWindow.render();
    });

    var VIS = true;
    $(volume_idVisibility).on('click', function() {
        volume_visibility_control.setVisibility(VIS);;
        renderWindow.render();
        VIS = !(VIS);
    });

}
/////////////////////////////////////////////////////////////////////////////////////////
// Surface Rendering by Yubraj Gupta/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
function surface_rendering(surface_imageData, surface_color_val){
      // const color_2 = vtk.Common.Core.vtkScalarsToColors.newInstance();

// var mycolor = Color_data;
// console.log(mycolor)

// 2. Get the data scalar range to set the first ISO value
var container = document.getElementById('viewContainer');
const interactorStyle = vtk.Interaction.Style.vtkInteractorStyleTrackballCamera.newInstance();
const interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
const genericRenderWindow = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance();
const openglRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
const vtkCamera = vtk.Rendering.Core.vtkCamera;
const renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
const vtkAnnotatedCubeActor = vtk.Rendering.Core.vtkAnnotatedCubeActor;
const vtkOrientationMarkerWidget = vtk.Interaction.Widgets.vtkOrientationMarkerWidget;

const vtkMouseCameraTrackballPanManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballPanManipulator;
const vtkMouseCameraTrackballZoomManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballZoomManipulator;
const vtkInteractorStyleManipulator = vtk.Interaction.Style.vtkInteractorStyleManipulator;
const vtkMouseCameraTrackballRotateManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballRotateManipulator;


openglRenderWindow.setContainer(container);
const { width, height } = container.getBoundingClientRect(); /////////////////////////
openglRenderWindow.setSize(width, height);
renderWindow.addView(openglRenderWindow);

console.log(surface_imageData.length)

const viewColors = [
  [0.0, 0.0, 0.0], // sagittal
  [0.0, 0.0, 0.0], // coronal
  [0.0, 0.0, 0.0], // axial
];

function getCenterOfScene (renderer) {
  const bounds = renderer.computeVisiblePropBounds();
  const center = [0, 0, 0];

  center[0] = (bounds[0] + bounds[1]) / 2.0;
  center[1] = (bounds[2] + bounds[3]) / 2.0;
  center[2] = (bounds[4] + bounds[5]) / 2.0;

  return center;
}

function createRGBStringFromRGBValues(rgb) {
  if (rgb.length !== 3) {
    return 'rgb(0, 0, 0)';
  }
  return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(rgb[2] * 255).toString()})`;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const HEX_Values = surface_color_val;
console.log(HEX_Values)

surface_opacity_val = []
console.log(surface_opacity_val)
surface_iso = []
console.log(surface_iso)
surface_iso_dataRange = []
console.log(surface_iso_dataRange)

      for (a = 0; a < surface_imageData.length; a++){

          // color_name = color_maps[i]
          // console.log(color_name)
          HEX_color_VALUES = HEX_Values[a]
          console.log(HEX_color_VALUES)
         /////////////////////////////////////////////////////////////////////////////////////////////////////
          RGB_value = hexToRgb(HEX_color_VALUES)
          console.log(RGB_value)
         ////////////////////////////////////////////////////////////////////////////////////////////////////
          console.log("###########################")
          // console.log(i)

          marchingC = vtk.Filters.General.vtkImageMarchingCubes.newInstance({contourValue: 0.0, computeNormals: true, mergePoints: true });
          actor = vtk.Rendering.Core.vtkActor.newInstance();
          mapper = vtk.Rendering.Core.vtkMapper.newInstance();
          ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();

          dataRange = surface_imageData[a].getPointData().getScalars().getRange();
          console.log(dataRange);

          firstIsoValue = (dataRange[0] + dataRange[1]) / 3;
          console.log(firstIsoValue)

          // marchingCube = vtk.Filters.General.vtkImageMarchingCubes.newInstance();
          marchingC.setInputData(surface_imageData[a]);
          marchingC.setContourValue((dataRange[0] + dataRange[1]) / 3);

          // mapper = vtk.Rendering.OpenGL.vtkOpenGLPolyDataMapper.newInstance();
          mapper.setInputConnection(marchingC.getOutputPort());

          mapper.setScalarVisibility(false);
          mapper.setScalarRange(0, 10);
          actor.setMapper(mapper);
          // actor.getProperty().setDiffuseColor(diffuse_color) //////////////// (222/256., 184/256., 135/256.)
          actor.getProperty().setColor(RGB_value.r/256., RGB_value.g/256., RGB_value.b/256.)
          // actor.getProperty().setDiffuseColor(preset);
          // actor.getProperty().setDiffuseColor(ctfun);
          actor.getProperty().setEdgeVisibility(0.0, 0.0, 0.0);
          actor.getProperty().setLighting(false);
          actor.getProperty().setSpecular(0.3)
          actor.getProperty().setSpecularPower(20)
          // actor.getProperty().setOpacity(0.9)
          // 6-1. Add actor on renderer
          renderer.addActor(actor);

          const axes = vtkAnnotatedCubeActor.newInstance();
          axes.setDefaultStyle({
            text: '+X',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            fontColor: 'white',
            // fontSizeScale: (res) => res / 2,
            faceColor: createRGBStringFromRGBValues(viewColors[0]),
            // faceRotation: 0, //
            edgeThickness: 0.1,
            edgeColor: 'white',
            resolution: 400,
          });
          // axes.setXPlusFaceProperty({ text: '+X' });
          axes.setXMinusFaceProperty({
            text: '-X',
            faceColor: createRGBStringFromRGBValues(viewColors[0]),
            // faceRotation: 90,
            //fontStyle: 'italic',
          });
          axes.setYPlusFaceProperty({
            text: '+Y',
            faceColor: createRGBStringFromRGBValues(viewColors[1]),
            // fontSizeScale: (res) => res / 4,
          });
          axes.setYMinusFaceProperty({
            text: '-Y',
            faceColor: createRGBStringFromRGBValues(viewColors[1]),
            // fontColor: 'white',
          });
          axes.setZPlusFaceProperty({
            text: '+Z',
            faceColor: createRGBStringFromRGBValues(viewColors[2]),
          });
          axes.setZMinusFaceProperty({
            text: '-Z',
            faceColor: createRGBStringFromRGBValues(viewColors[2]),
            // faceRotation: 45,
          });

        // create orientation widget
        orientationWidget = vtkOrientationMarkerWidget.newInstance({actor: axes, interactor: interactor});
        setTimeout(() => {
        // debugger;
        orientationWidget.setEnabled(true);
        orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
        orientationWidget.setViewportSize(0.15);
        orientationWidget.setMinPixelSize(20);
        orientationWidget.setMaxPixelSize(80);
        }, 1);

        window.onresize = () => {orientationWidget.updateViewport();}

        // renderer.resetCamera();
        // renderWindow.render();

        surface_opacity_val[a] = actor
        console.log(surface_opacity_val[a])
        surface_iso[a] = marchingC
        console.log(surface_iso[a])
        surface_iso_dataRange[a]  = dataRange
        console.log(surface_iso_dataRange[a])

      }

// slider for a opacity and Iso values
for(b=0; b<surface_imageData.length; b++){
    surface_idOpacity = "#setOpacity"+ b
    surface_idISO = "#isoValue"+ b
    surface_idEDVSI = "#sur_edge_visibility"+ b
    //idColor = "#favcolor"+ t
    // idISO_att = "#isoValue"+ t

    console.log(surface_idOpacity)
    console.log(surface_idISO)
    // console.log(idColor)
    // console.log(iso_dataRange)

    z = b
    // console.log(v)
    trigger_changes_iso(surface_idOpacity, surface_idEDVSI, surface_opacity_val[z], surface_idISO, surface_iso[z], surface_iso_dataRange[z], renderWindow)
};
////////////////////////////////////////////////////////
const center = getCenterOfScene(renderer);
////////////////////////////////////////////////////////

const camera = vtkCamera.newInstance();
// renderer.getActiveCamera();
// prevent zoom manipulator from messing with our focal point
// camera.setFreezeFocalPoint(true);
// renderer.getActiveCamera().set({ position: [1, 1, 0], viewUp: [0, 0, -1] });
camera.getFocalPoint()
camera.elevation(70);
// renderWindow.render()
renderWindow.addRenderer(renderer);

interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(container);
// interactor.setInteractorStyle(interactorStyle);
/////////////////////////////////////////////////////////////////////////////////////////////
const PanSelector = vtkMouseCameraTrackballPanManipulator.newInstance({ button: 3 },);
const ZoomSelector = vtkMouseCameraTrackballZoomManipulator.newInstance({ scrollEnabled: true, dragEnabled: false },);
const Rotate = vtkMouseCameraTrackballRotateManipulator.newInstance({ button: 1 },);
// const center = getCenterOfScene(camera.getFocalPoint());
// { button: 2 },
const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addMouseManipulator(PanSelector);
iStyle.addMouseManipulator(ZoomSelector);
iStyle.addMouseManipulator(Rotate);
iStyle.setCenterOfRotation(center);

renderWindow.getInteractor().setInteractorStyle(iStyle);
///////////////////////////////////////////////////////////////////////////////////////////////
renderer.resetCamera();
renderWindow.render();

}

function trigger_changes_iso(surface_idOpacity, surface_idEDVSI, surface_opacity_val, surface_idISO, surface_iso, surface_iso_dataRange, renderWindow){

    // Control Sample Opacity
    $(surface_idOpacity).change(function() {
      newVal = this.value
      console.log(newVal)
      // console.log(opacity_val)
       surface_opacity_val.getProperty().setOpacity(newVal) // Helps to adjust transparency of the rendered Image (differs within rendered image)
       renderWindow.render() // We use it inside function to react instantly.
       // console.log(newVal)
    });

    // Control Iso Contour Value
    function updateIsoValue(s) {
      const isoValue = Number(s.target.value);
      console.log(isoValue)
      surface_iso.setContourValue(isoValue);
      renderWindow.render();
    }

    const el = document.querySelector(surface_idISO);
    el.setAttribute('min', surface_iso_dataRange[0]);
    el.setAttribute('max', surface_iso_dataRange[1]);
    el.setAttribute('value', ((surface_iso_dataRange[0] + surface_iso_dataRange[1]) / 3));
    el.addEventListener('input', updateIsoValue);

    var edge = false;
    $(surface_idEDVSI).on('click', function() {
        surface_opacity_val.getProperty().setEdgeVisibility(edge);
        renderWindow.render();
        edge = !(edge);
    });
}

/////////////////////////////////////////////////////////////////////////////////////////
// Tri-planar Rendering by Yubraj Gupta/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
function tri_planar_rendering(tri_imageData){
// const color_2 = vtk.Common.Core.vtkScalarsToColors.newInstance();

// var mycolor = Color_data;
// console.log(mycolor)

// 2. Get the data scalar range to set the first ISO value
var container = document.getElementById('viewContainer');

const openglRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
const renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
const vtkInteractorStyleTrackballCamera = vtk.Interaction.Style.vtkInteractorStyleTrackballCamera;
const vtkRenderWindowInteractor = vtk.Rendering.Core.vtkRenderWindowInteractor;
const vtkAnnotatedCubeActor = vtk.Rendering.Core.vtkAnnotatedCubeActor;
const vtkOrientationMarkerWidget = vtk.Interaction.Widgets.vtkOrientationMarkerWidget;

const vtkMouseCameraTrackballPanManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballPanManipulator;
const vtkMouseCameraTrackballZoomManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballZoomManipulator;
const vtkInteractorStyleManipulator = vtk.Interaction.Style.vtkInteractorStyleManipulator;
const vtkMouseCameraTrackballRotateManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballRotateManipulator;
const vtkGestureCameraManipulator =  vtk.Interaction.Manipulators.vtkGestureCameraManipulator;

const vtkImageSlice = vtk.Rendering.Core.vtkImageSlice;
const vtkImageMapper = vtk.Rendering.Core.vtkImageMapper;
const PiecewiseFun = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
const ColorTransFun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();

openglRenderWindow.setContainer(container);
renderWindow.addView(openglRenderWindow);
const { width, height } = container.getBoundingClientRect(); /////////////////////////
openglRenderWindow.setSize(width, height);

const imageActorI = vtkImageSlice.newInstance(); // 2D YZ images.
const imageActorJ = vtkImageSlice.newInstance(); // 2D XZ images.
const imageActorK = vtkImageSlice.newInstance(); // 2D XY images.

renderer.addActor(imageActorK);
renderer.addActor(imageActorJ);
renderer.addActor(imageActorI);

function getCenterOfScene (renderer) {
  const bounds = renderer.computeVisiblePropBounds();
  const center = [0, 0, 0];

  center[0] = (bounds[0] + bounds[1]) / 2.0;
  center[1] = (bounds[2] + bounds[3]) / 2.0;
  center[2] = (bounds[4] + bounds[5]) / 2.0;

  return center;
}

function updateColorLevel(e) {
        const colorLevel = Number((e ? e.target : document.querySelector('.colorLevel')).value);
        imageActorI.getProperty().setColorLevel(colorLevel);
        imageActorJ.getProperty().setColorLevel(colorLevel);
        imageActorK.getProperty().setColorLevel(colorLevel);
        renderWindow.render();
};

function updateColorWindow(e) {
        const colorLevel = Number((e ? e.target : document.querySelector('.colorWindow')).value);
        imageActorI.getProperty().setColorWindow(colorLevel);
        imageActorJ.getProperty().setColorWindow(colorLevel);
        imageActorK.getProperty().setColorWindow(colorLevel);
        renderWindow.render();
};

const viewColors = [
  [0.0, 0.0, 0.0], // sagittal
  [0.0, 0.0, 0.0], // coronal
  [0.0, 0.0, 0.0], // axial
];

function createRGBStringFromRGBValues(rgb) {
  if (rgb.length !== 3) {
    return 'rgb(0, 0, 0)';
  }
  return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(rgb[2] * 255).toString()})`;
}

imageI = []
imageJ = []
imageK = []

      for (y = 0; y < tri_imageData.length; y++){
//        console.log("###########################")
//        console.log(i)
//        console.log("###########################")

        const dataRange = tri_imageData[y].getPointData().getScalars().getRange();
        console.log(dataRange);

        console.log(dataRange[0]);
        console.log(dataRange[1]);

        const extent = tri_imageData[y].getExtent();
        console.log(extent);
        console.log("###########################")

        const imageMapperK = vtkImageMapper.newInstance();
        imageMapperK.setInputData(tri_imageData[y]);
        imageMapperK.setKSlice(0);
        imageActorK.setMapper(imageMapperK);

        const imageMapperJ = vtkImageMapper.newInstance();
        imageMapperJ.setInputData(tri_imageData[y]);
        imageMapperJ.setJSlice(0);
        imageActorJ.setMapper(imageMapperJ);

        const imageMapperI = vtkImageMapper.newInstance();
        imageMapperI.setInputData(tri_imageData[y]);
        imageMapperI.setISlice(0);
        imageActorI.setMapper(imageMapperI);

        ['.YZ', '.XZ', '.XY'].forEach((selector, idx) => {
                const el = document.querySelector(selector);
                el.setAttribute('min', extent[idx * 2 + 0]);
                el.setAttribute('max', extent[idx * 2 + 1]);
                el.setAttribute('value', 0);
        });

        ['.colorLevel', '.colorWindow'].forEach((selector) => {
                document.querySelector(selector).setAttribute('max', dataRange[1]);
                document.querySelector(selector).setAttribute('value', dataRange[1]);
        });

        document.querySelector('.colorLevel').setAttribute('value', (dataRange[0] + dataRange[1]) / 2);
        updateColorLevel();
        updateColorWindow();

        renderer.resetCamera();
        renderer.resetCameraClippingRange();
        renderWindow.render();
        renderWindow.addRenderer(renderer);

        imageI = imageActorI // 2D YZ images.
        imageJ = imageActorJ// 2D XZ images.
        imageK = imageActorK // 2D XY images.
      }


document.querySelector('.YZ').addEventListener('input', (e) => {
    imageActorI.getMapper().setISlice(Number(e.target.value));
    renderWindow.render();
});

document.querySelector('.XZ').addEventListener('input', (e) => {
    imageActorJ.getMapper().setJSlice(Number(e.target.value));
    renderWindow.render();
});

document.querySelector('.XY').addEventListener('input', (e) => {
    imageActorK.getMapper().setKSlice(Number(e.target.value));
    renderWindow.render();
});

document.querySelector('.colorLevel').addEventListener('input', updateColorLevel);
document.querySelector('.colorWindow').addEventListener('input', updateColorWindow);


// slider for a opacity and Iso values
//for(n=0; n<tri_imageData.length; n++){
//    tri_planar_xy = "#XY_button"
//    tri_planar_xz = "#XZ_button"
//    tri_planar_yz = "#YZ_button"

var edge_K = edge_J = edge_I = true;

$("#XY_button").on('click', function() {
    imageK.setVisibility(edge_K);
    renderWindow.render();
    edge_K = !(edge_K);
});

$("#XZ_button").on('click', function() {
    imageJ.setVisibility(edge_J);
    renderWindow.render();
    edge_J = !(edge_J);
});

$("#YZ_button").on('click', function() {
    imageI.setVisibility(edge_I);
    renderWindow.render();
    edge_I = !(edge_I);
});

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(container);
// interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

const center = getCenterOfScene(renderer);
/////////////////////////////////////////////////////////////////////////////////////////////
//const PanSelector = vtkMouseCameraTrackballPanManipulator.newInstance({ button: 3 },);
//const ZoomSelector = vtkMouseCameraTrackballZoomManipulator.newInstance({ scrollEnabled: true, dragEnabled: false },);
//const Rotate = vtkMouseCameraTrackballRotateManipulator.newInstance({ button: 1 },);
// const center = getCenterOfScene(camera.getFocalPoint());
// { button: 2 },
const iStyle = vtkInteractorStyleManipulator.newInstance();
//iStyle.addMouseManipulator(PanSelector);
//iStyle.addMouseManipulator(ZoomSelector);
//iStyle.addMouseManipulator(Rotate);
iStyle.setCenterOfRotation(center);


//"#Rotate_button"

const uiComponents = {};
const selectMap = {
  leftButton: { button: 1 },
  rightButton: { button: 3 },
  scrollMiddleButton: { scrollEnabled: true, dragEnabled: false },
};

const manipulatorFactory = {
  None: null,
  Pan: vtkMouseCameraTrackballPanManipulator,
  Zoom: vtkMouseCameraTrackballZoomManipulator,
  Rotate: vtkMouseCameraTrackballRotateManipulator,
};

function reassignManipulators() {
  iStyle.removeAllMouseManipulators();
  Object.keys(uiComponents).forEach((keyName) => {
    const klass = manipulatorFactory[uiComponents[keyName].manipName];
    if (klass) {
      const manipulator = klass.newInstance();
      manipulator.setButton(selectMap[keyName].button);
      if (selectMap[keyName].scrollEnabled !== undefined) {
        manipulator.setScrollEnabled(selectMap[keyName].scrollEnabled);
      }
      if (selectMap[keyName].dragEnabled !== undefined) {
        manipulator.setDragEnabled(selectMap[keyName].dragEnabled);
      }
      iStyle.addMouseManipulator(manipulator);
    }
  });

  // Always add gesture
  iStyle.addGestureManipulator(
    vtkGestureCameraManipulator.newInstance()
  );
}

Object.keys(selectMap).forEach((name) => {
  const elt = document.querySelector(`.${name}`);
  elt.addEventListener('change', (e) => {
    uiComponents[name].manipName = e.target.value;
    reassignManipulators();
  });
  uiComponents[name] = {
    elt,
    manipName: elt.value,
  };
});


renderWindow.getInteractor().setInteractorStyle(iStyle);
////////////////////////////////////////////////////////////////////////////////////////////////
const axes = vtkAnnotatedCubeActor.newInstance();

axes.setDefaultStyle({
text: '+X',
fontStyle: 'bold',
fontFamily: 'Arial',
fontColor: 'white',
// fontSizeScale: (res) => res / 2,
faceColor: createRGBStringFromRGBValues(viewColors[0]),
// faceRotation: 0, //
edgeThickness: 0.1,
edgeColor: 'white',
resolution: 1600,
});
// axes.setXPlusFaceProperty({ text: '+X' });
axes.setXMinusFaceProperty({
text: '-X',
faceColor: createRGBStringFromRGBValues(viewColors[0]),
// faceRotation: 90,
//fontStyle: 'italic',
});
axes.setYPlusFaceProperty({
text: '+Y',
faceColor: createRGBStringFromRGBValues(viewColors[1]),
// fontSizeScale: (res) => res / 4,
});
axes.setYMinusFaceProperty({
text: '-Y',
faceColor: createRGBStringFromRGBValues(viewColors[1]),
// fontColor: 'white',
});
axes.setZPlusFaceProperty({
text: '+Z',
faceColor: createRGBStringFromRGBValues(viewColors[2]),
});
axes.setZMinusFaceProperty({
text: '-Z',
faceColor: createRGBStringFromRGBValues(viewColors[2]),
// faceRotation: 45,
});

// create orientation widget
orientationWidget = vtkOrientationMarkerWidget.newInstance({actor: axes, interactor: interactor});
setTimeout(() => {
// debugger;
    orientationWidget.setEnabled(true);
    orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
    orientationWidget.setViewportSize(0.15);
    orientationWidget.setMinPixelSize(20);
    orientationWidget.setMaxPixelSize(80);
}, 1);

window.onresize = () => {orientationWidget.updateViewport();}

renderer.resetCamera();
renderWindow.render()

}
/////////////////////////////////////////////////////////////////////////////////////////
// Multi-Planar Reconstruction Rendering by Yubraj Gupta/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
function mpr_rendering(mpr_imageData){

const SlabMode = {
  MIN: 0,
  MAX: 1,
  MEAN: 2,
  SUM: 3,
};

const ViewTypes = {
  DEFAULT: 0,
  GEOMETRY: 1,
  SLICE: 2,
  VOLUME: 3,
  YZ_PLANE: 4, // Sagittal
  XZ_PLANE: 5, // Coronal
  XY_PLANE: 6, // Axial
};

const CaptureOn = {
  MOUSE_MOVE: 0,
  MOUSE_RELEASE: 1,
};

const xyzToViewType = [
  ViewTypes.YZ_PLANE,
  ViewTypes.XZ_PLANE,
  ViewTypes.XY_PLANE,
];


//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
/////  CALL THE VTK FUNCTIONS ///////////////////////////////////
////////////////////////////////////////////////////////////////
const vtkPiecewiseFunction = vtk.Common.DataModel.vtkPiecewiseFunction;
const vtkColorTransferFunction = vtk.Rendering.Core.vtkColorTransferFunction;
const vtkInteractorStyleTrackballCamera = vtk.Interaction.Style.vtkInteractorStyleTrackballCamera;
const vtkVolume = vtk.Rendering.Core.vtkVolume;
const vtkVolumeMapper = vtk.Rendering.Core.vtkVolumeMapper;
const vtkImageSlice = vtk.Rendering.Core.vtkImageSlice;
const vtkImageMapper = vtk.Rendering.Core.vtkImageMapper;
const vtkInteractorStyleImage = vtk.Interaction.Style.vtkInteractorStyleImage;
const vtkActor = vtk.Rendering.Core.vtkActor;
const vtkAnnotatedCubeActor = vtk.Rendering.Core.vtkAnnotatedCubeActor;
const vtkDataArray = vtk.Common.Core.vtkDataArray;
const vtkHttpDataSetReader = vtk.IO.Core.vtkHttpDataSetReader;
const vtkGenericRenderWindow = vtk.Rendering.Misc.vtkGenericRenderWindow;
// const vtkImageData = vtk.Common.DataModel.vtkImageData;
const vtkImageReslice = vtk.Imaging.Core.vtkImageReslice;
const vtkMapper = vtk.Rendering.Core.vtkMapper;
const vtkOutlineFilter = vtk.Filters.General.vtkOutlineFilter;
const vtkOrientationMarkerWidget = vtk.Interaction.Widgets.vtkOrientationMarkerWidget;
const vtkResliceCursorWidget = vtk.Widgets.Widgets3D.vtkResliceCursorWidget;
const vtkWidgetManager = vtk.Widgets.Core.vtkWidgetManager;
const vtkSphereSource = vtk.Filters.Sources.vtkSphereSource;
const controlPanel = vtkResliceCursorWidget.controlPanel;
// const { vec3 } = 'gl-matrix';

console.log(mpr_imageData.length)
///////////////////////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------------
// Define main attributes
// ----------------------------------------------------------------------------

const viewColors = [
  [0.0, 0.0, 0.0], // sagittal
  [0.0, 0.0, 0.0], // coronal
  [0.0, 0.0, 0.0], // axial
  [0.0, 0.0, 0.0], // 3D
];

const viewAttributes = [];
const widget = vtkResliceCursorWidget.newInstance();
const widgetState = widget.getWidgetState();
widgetState.setKeepOrthogonality(true);
widgetState.setOpacity(0.9);
widgetState.setSphereRadius(10);
widgetState.setLineThickness(5);
// widgetState.setColorLevel(127.5);
// widgetState.setColorWindow(255);

const showDebugActors = true;
///////////////////////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------------
// Define html structure
// ----------------------------------------------------------------------------

// const container = document.querySelector('body');
// const controlContainer = document.createElement('div');
// controlContainer.innerHTML = controlPanel;
// container.appendChild(controlContainer);

const container = document.getElementById('viewContainer');
// const container = document.querySelector('body');
// const controlContainer = document.createElement('div');
// controlContainer.innerHTML = controlPanel;
// container.appendChild(controlContainer);

////////////////////////////////////////////////////////////////////////////////////
function createRGBStringFromRGBValues(rgb) {
  if (rgb.length !== 3) {
    return 'rgb(0, 0, 0)';
  }
  return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(rgb[2] * 255).toString()})`;
}

const initialPlanesState = { ...widgetState.getPlanes() };

let view3D = null;
///////////////////////////////////////////////////////////////////////////////////
/////// create axes, orientation widget
for (let i = 0; i < 4; i++) {
  const element = document.createElement('div');
  element.setAttribute('class', 'view');
  element.style.width = '50%';
  element.style.height = '400px';
  element.style.display = 'block';
  container.appendChild(element);

  const grw = vtkGenericRenderWindow.newInstance();
  grw.setContainer(element);
  grw.resize();

  const obj = {
    renderWindow: grw.getRenderWindow(),
    renderer: grw.getRenderer(),
    GLWindow: grw.getOpenGLRenderWindow(),
    interactor: grw.getInteractor(),
    widgetManager: vtkWidgetManager.newInstance(),
  };

  obj.renderer.getActiveCamera().setParallelProjection(true);
  obj.renderer.setBackground(...viewColors[i]);
  obj.renderWindow.addRenderer(obj.renderer);
  obj.renderWindow.addView(obj.GLWindow);
  obj.renderWindow.setInteractor(obj.interactor);

  obj.interactor.setView(obj.GLWindow);
  obj.interactor.initialize();
  obj.interactor.bindEvents(element);
  obj.widgetManager.setRenderer(obj.renderer);
  if (i < 3) {
    obj.interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance());
    obj.widgetInstance = obj.widgetManager.addWidget(widget, xyzToViewType[i]);
    obj.widgetInstance.setScaleInPixels(true); //////////////////////////////
    obj.widgetInstance.setRotationHandlePosition(0.75); //////////////////////////////////
    obj.widgetManager.enablePicking();
    // Use to update all renderers buffer when actors are moved
    obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);
  } else {
    obj.interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
  }

  obj.reslice = vtkImageReslice.newInstance();
  // obj.reslice.setSlabMode(SlabMode.MEAN);
  // obj.reslice.setSlabNumberOfSlices(1);
  obj.reslice.setTransformInputSampling(false);
  obj.reslice.setAutoCropOutput(true);
  obj.reslice.setOutputDimensionality(2); //////////////////////////////
  // console.log("#########ImageMapper########################");
  obj.resliceMapper = vtkImageMapper.newInstance();
  // console.log(obj.resliceMapper);
  obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
  // console.log(obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort()));
  // console.log("#################################");
  obj.resliceActor = vtkImageSlice.newInstance(); // IMAGE ACTOR
  obj.resliceActor.setMapper(obj.resliceMapper);
  obj.sphereActors = [];
  obj.sphereSources = [];

  // Create sphere for each 2D views which will be displayed in 3D
  // Define origin, point1 and point2 of the plane used to reslice the volume
  for (let j = 0; j < 3; j++) {
    const sphere = vtkSphereSource.newInstance();
    sphere.setRadius(10); /////////////////////////////////////////////////////////
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(sphere.getOutputPort());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.getProperty().setColor(...viewColors[i]);
    actor.setVisibility(showDebugActors);
    obj.sphereActors.push(actor);
    obj.sphereSources.push(sphere);
  }

  if (i < 3) {
    viewAttributes.push(obj);
  } else {
    view3D = obj;
  }

  // create axes ////////////////////////////////////////////////////////////////////////////////////////////
  const axes = vtkAnnotatedCubeActor.newInstance();
  axes.setDefaultStyle({
    text: '+X',
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'white',
    // fontSizeScale: (res) => res / 2,
    faceColor: createRGBStringFromRGBValues(viewColors[0]),
    // faceRotation: 0, //
    edgeThickness: 0.1,
    edgeColor: 'white',
    resolution: 400,
  });
  // axes.setXPlusFaceProperty({ text: '+X' });
  axes.setXMinusFaceProperty({
    text: '-X',
    faceColor: createRGBStringFromRGBValues(viewColors[0]),
    // faceRotation: 90,
    // fontStyle: 'italic',
  });
  axes.setYPlusFaceProperty({
    text: '+Y',
    faceColor: createRGBStringFromRGBValues(viewColors[1]),
    // fontSizeScale: (res) => res / 4,
  });
  axes.setYMinusFaceProperty({
    text: '-Y',
    faceColor: createRGBStringFromRGBValues(viewColors[1]),
    // fontColor: 'white',
  });
  axes.setZPlusFaceProperty({
    text: '+Z',
    faceColor: createRGBStringFromRGBValues(viewColors[2]),
  });
  axes.setZMinusFaceProperty({
    text: '-Z',
    faceColor: createRGBStringFromRGBValues(viewColors[2]),
    // faceRotation: 45,
  });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // create orientation widget
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: obj.renderWindow.getInteractor(),
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(20);
  orientationWidget.setMaxPixelSize(80);
}
///////////////////////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------------
// Load image
// ----------------------------------------------------------------------------
function updateReslice(interactionContext = {
    viewType: '', reslice: null, actor: null, renderer: null,resetFocalPoint: false, keepFocalPointPosition: false,
    computeFocalPointOffset: false, spheres: null,
})
{
  const obj = widget.updateReslicePlane( interactionContext.reslice, interactionContext.viewType);
  if (obj.modified) {
    // Get returned modified from setter to know if we have to render
    interactionContext.actor.setUserMatrix(interactionContext.reslice.getResliceAxes());
    interactionContext.sphereSources[0].setCenter(...obj.origin);
    interactionContext.sphereSources[1].setCenter(...obj.point1);
    interactionContext.sphereSources[2].setCenter(...obj.point2);
  }
  widget.updateCameraPoints(
    interactionContext.renderer, interactionContext.viewType, interactionContext.resetFocalPoint,
    interactionContext.keepFocalPointPosition, interactionContext.computeFocalPointOffset );
  view3D.renderWindow.render();
  return obj.modified;
}

   for (m = 0; m < mpr_imageData.length; m++){

        // const image = imageData[i].getOutputData();
        // console.log(image);
        // console.log("##############widget###################");
        widget.setImage(mpr_imageData[m]); //////////////////////////////////////////////
        // console.log(widget);
        // console.log("#################################");

        // Create image outline in 3D view
        const outline = vtkOutlineFilter.newInstance();
        // console.log("############vtkOutlineFilter#####################");
        outline.setInputData(mpr_imageData[m]); ////////////////////////////////////////////
        // console.log(outline);
        // console.log("#################################");
        const outlineMapper = vtkMapper.newInstance();
        // console.log("############outlineMapper#####################");
        outlineMapper.setInputData(outline.getOutputData());
        // console.log(outlineMapper);
        // console.log("#################################");
        const outlineActor = vtkActor.newInstance();
        outlineActor.setMapper(outlineMapper);
        view3D.renderer.addActor(outlineActor);

        viewAttributes.forEach((obj, i) => {
            obj.reslice.setInputData(mpr_imageData[m]); ////////////////////////////////////////////
            obj.renderer.addActor(obj.resliceActor);
            view3D.renderer.addActor(obj.resliceActor);
            obj.sphereActors.forEach((actor) => {
                obj.renderer.addActor(actor);
                view3D.renderer.addActor(actor);
            });
            const reslice = obj.reslice;
            const viewType = xyzToViewType[i];

            viewAttributes.forEach((v) => {
                v.widgetInstance.onInteractionEvent(
                ({ computeFocalPointOffset, canUpdateFocalPoint }) => {
                      const activeViewType = widget.getWidgetState().getActiveViewType(); /////////////////////
                      const keepFocalPointPosition = activeViewType !== viewType && canUpdateFocalPoint;
                      updateReslice({viewType, reslice, actor: obj.resliceActor, renderer: obj.renderer, resetFocalPoint: false,
                      keepFocalPointPosition, computeFocalPointOffset, sphereSources: obj.sphereSources, });
                }
              );
            });
            updateReslice({ viewType, reslice, actor: obj.resliceActor, renderer: obj.renderer,
                resetFocalPoint: true,keepFocalPointPosition: false,computeFocalPointOffset: true,
                sphereSources: obj.sphereSources,
            });
            obj.renderWindow.render();
        });

    view3D.renderer.resetCamera();
    view3D.renderer.resetCameraClippingRange();
   }


///////////////////////////////////////////////////////////////////////////////////
// ----------------------------------------------------------------------------
// Define panel interactions
// ----------------------------------------------------------------------------
function updateViews() {
  viewAttributes.forEach((obj, i) => {
    updateReslice({ viewType: xyzToViewType[i], reslice: obj.reslice, actor: obj.resliceActor, renderer: obj.renderer,
      resetFocalPoint: true, keepFocalPointPosition: false, computeFocalPointOffset: true,
      sphereSources: obj.sphereSources, resetViewUp: true,
    });
    obj.renderWindow.render();
  });
  view3D.renderer.resetCamera();
  view3D.renderer.resetCameraClippingRange();
}

const checkboxScaleInPixels = document.getElementById('checkboxScaleInPixels');
checkboxScaleInPixels.addEventListener('change', (ev) => {
  viewAttributes.forEach((obj) => {
    obj.widgetInstance.setScaleInPixels(checkboxScaleInPixels.checked);
    obj.interactor.render();
  });
});


const buttonReset = document.getElementById('buttonReset');
buttonReset.addEventListener('click', () => {
  widgetState.setPlanes({ ...initialPlanesState });
  widget.setCenter(widget.getWidgetState().getImage().getCenter());
  updateViews();
});

}
/////////////////////////////////////////////////////////////////////////////////////////
// Input callback functions created by Rodrigo/////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
///////////////////////// CALLS VOLUME RENDERING FUNCTION /////////////////////////////
function vol_processFile(vol_arrFileList, vol_color_val) {
  var vol_img  = []
  console.log(vol_arrFileList)
  const vol_files = vol_arrFileList

vol_prom = []

for ( l = 0 ; l < vol_files.length; l++){
    console.time('image_loading_Time');
    if (l  == 0){
        if (vol_files[l].length === 1) {
              vol_prom[l] = itk.readImageFile(null, vol_files[l][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                vol_imageData = convertItkToVtkImage(itkImage)
                console.log(vol_imageData)
                vol_img.push(vol_imageData)
              })
          } else {
           vol_prom[l] = itk.readImageDICOMFileSeries(vol_files[l]).then(function ({ image: itkImage }) {
            vol_imageData = convertItkToVtkImage(itkImage)
            console.log(vol_imageData)
             vol_img.push(vol_imageData)
              })
          }
        }
    else {
        if (vol_files[l].length === 1) {
              vol_prom[l] = itk.readImageFile(null, vol_files[l][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                vol_imageData = convertItkToVtkImage(itkImage)
                console.log(vol_imageData)
                 vol_img.push(vol_imageData)
              })
          } else {
            vol_prom[l] = itk.readImageDICOMFileSeries(vol_files[l]).then(function ({ image: itkImage }) {
                vol_imageData = convertItkToVtkImage(itkImage)
               // console.log(imageData)
                 vol_img.push(vol_imageData)
                  })
      }
    }
    setTimeout(function delay(){
      console.timeEnd('image_loading_Time');
    }, 1500);
}

Promise.all(vol_prom).then((values) => {
    console.log(vol_prom)

    $( "#btn2" ).prop( "disabled", true )
     $( "#f" ).prop( "disabled", true )
     $( ".colors_channels" ).prop( "disabled", true )
    //while(true){
    console.time('image_render_Time');
     volume_rendering(vol_img, vol_color_val) // Calls Volume rendering script
     // surface_rendering(img, color_val) // Calls surface rendering script
     // tri_planar_rendering(img) // Calls Tri-Planar rendering script
     // mpr_rendering(img) // Calls Multi-Planar Reconstruction rendering script

     console.log(vol_img.length +"  -  "+ vol_files.length)
     //if(img.length == files.length){
       // break;
     //}
    //}
        setTimeout(function delay(){
      console.timeEnd('image_render_Time');
    }, 1500);
}).catch(
console.log("Please check the input files again"));
//console.log(img)

}
/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////// CALLS SURFACE RENDERING FUNCTION /////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
function sur_processFile(sur_arrFileList, sur_color_val) {
  var sur_img  = []
  console.log(sur_arrFileList)
  const sur_files = sur_arrFileList

sur_prom = []

for ( w = 0 ; w < sur_files.length; w++){
    console.time('image_loading_Time');
    if (w  == 0){
        if (sur_files[w].length === 1) {
              sur_prom[w] = itk.readImageFile(null, sur_files[w][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                sur_imageData = convertItkToVtkImage(itkImage)
                console.log(sur_imageData)
                sur_img.push(sur_imageData)
              })
          } else {
           sur_prom[w] = itk.readImageDICOMFileSeries(sur_files[w]).then(function ({ image: itkImage }) {
            sur_imageData = convertItkToVtkImage(itkImage)
            console.log(sur_imageData)
             sur_img.push(sur_imageData)
              })
          }
        }
    else {
        if (sur_files[w].length === 1) {
              sur_prom[w] = itk.readImageFile(null, sur_files[w][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                sur_imageData = convertItkToVtkImage(itkImage)
                console.log(sur_imageData)
                 sur_img.push(sur_imageData)
              })
          } else {
            sur_prom[w] = itk.readImageDICOMFileSeries(sur_files[w]).then(function ({ image: itkImage }) {
                sur_imageData = convertItkToVtkImage(itkImage)
               // console.log(imageData)
                 sur_img.push(sur_imageData)
                  })
      }
    }
    setTimeout(function delay(){
      console.timeEnd('image_loading_Time');
    }, 1500);
}

Promise.all(sur_prom).then((values) => {
    console.log(sur_prom)

    $( "#btn2" ).prop( "disabled", true )
     $( "#f" ).prop( "disabled", true )
     $( ".col_sur" ).prop( "disabled", true )
    //while(true){
     console.time('image_render_Time');
     // volume_rendering(img, color_val) // Calls Volume rendering script
     surface_rendering(sur_img, sur_color_val) // Calls surface rendering script
     // tri_planar_rendering(img) // Calls Tri-Planar rendering script
     // mpr_rendering(img) // Calls Multi-Planar Reconstruction rendering script

     console.log(sur_img.length +"  -  "+ sur_files.length)
     //if(img.length == files.length){
       // break;
     //}
    //}
    setTimeout(function delay(){
    console.timeEnd('image_render_Time');
    }, 1500);
}).catch(
console.log("Please check the input files again"));
//console.log(img)

}
/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////// CALLS TRI-PLANAR RENDERING FUNCTION /////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
function tri_processFile(tri_arrFileList) {
  var tri_img  = []
  console.log(tri_arrFileList)
  const tri_files = tri_arrFileList

tri_prom = []

for ( v = 0 ; v < tri_files.length; v++){
    console.time('image_loading_Time');
    if (v  == 0){
        if (tri_files[v].length === 1) {
              tri_prom[v] = itk.readImageFile(null, tri_files[v][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                tri_imageData = convertItkToVtkImage(itkImage)
                console.log(tri_imageData)
                tri_img.push(tri_imageData)
              })
          } else {
           tri_prom[v] = itk.readImageDICOMFileSeries(tri_files[v]).then(function ({ image: itkImage }) {
            tri_imageData = convertItkToVtkImage(itkImage)
            console.log(tri_imageData)
             tri_img.push(tri_imageData)
              })
          }
        }
    else {
        if (tri_files[v].length === 1) {
              tri_prom[v] = itk.readImageFile(null, tri_files[v][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                tri_imageData = convertItkToVtkImage(itkImage)
                console.log(tri_imageData)
                 tri_img.push(tri_imageData)
              })
          } else {
            tri_prom[v] = itk.readImageDICOMFileSeries(tri_files[v]).then(function ({ image: itkImage }) {
                tri_imageData = convertItkToVtkImage(itkImage)
               // console.log(imageData)
                 tri_img.push(tri_imageData)
                  })
      }
    }
    setTimeout(function delay(){
    console.timeEnd('image_loading_Time');
    }, 1500);
}

Promise.all(tri_prom).then((values) => {
    console.log(tri_prom)

    $( "#btn2" ).prop( "disabled", true )
     $( "#f" ).prop( "disabled", true )

     // $( ".colors_channels" ).prop( "disabled", true )
    //while(true){
    console.time('image_render_Time');
     // volume_rendering(img, color_val) // Calls Volume rendering script
     // surface_rendering(img, color_val) // Calls surface rendering script
     tri_planar_rendering(tri_img) // Calls Tri-Planar rendering script
     // mpr_rendering(img) // Calls Multi-Planar Reconstruction rendering script

     console.log(tri_img.length +"  -  "+ tri_files.length)
     //if(img.length == files.length){
       // break;
     //}
    //}
    setTimeout(function delay(){
    console.timeEnd('image_render_Time');
    }, 1500);
}).catch(
console.log("Please check the input files again"));
//console.log(img)
}
/////////////////////////////////////////////////////////////////////////////////////////
///////////////////////// CALLS MPR RENDERING FUNCTION /////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
function mpr_processFile(mpr_arrFileList) {
  var mpr_img  = []
  console.log(mpr_arrFileList)
  const mpr_files = mpr_arrFileList

mpr_prom = []

for ( u = 0 ; u < mpr_files.length; u++){
    console.time('image_loading_Time');
    if (u  == 0){
        if (mpr_files[u].length === 1) {
              mpr_prom[u] = itk.readImageFile(null, mpr_files[u][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                mpr_imageData = convertItkToVtkImage(itkImage)
                console.log(mpr_imageData)
                mpr_img.push(mpr_imageData)
              })
          } else {
           mpr_prom[u] = itk.readImageDICOMFileSeries(mpr_files[u]).then(function ({ image: itkImage }) {
            mpr_imageData = convertItkToVtkImage(itkImage)
            console.log(mpr_imageData)
             mpr_img.push(mpr_imageData)
              })
          }
        }
    else {
        if (mpr_files[u].length === 1) {
              mpr_prom[u] = itk.readImageFile(null, mpr_files[u][0])
              .then(function ({ webWorker, image: itkImage }) {
                webWorker.terminate()
                mpr_imageData = convertItkToVtkImage(itkImage)
                console.log(mpr_imageData)
                 mpr_img.push(mpr_imageData)
              })
          } else {
            mpr_prom[u] = itk.readImageDICOMFileSeries(mpr_files[u]).then(function ({ image: itkImage }) {
                mpr_imageData = convertItkToVtkImage(itkImage)
               // console.log(imageData)
                 mpr_img.push(mpr_imageData)
                  })
      }
    }
    setTimeout(function delay(){
    console.timeEnd('image_loading_Time');
    }, 1500);
}

Promise.all(mpr_prom).then((values) => {
    console.log(mpr_prom)

    $( "#btn2" ).prop( "disabled", true )
     // $( "#f" ).prop( "disabled", true )
     //$( ".colors_channels" ).prop( "disabled", true )
    //while(true){
        console.time('image_render_Time');
     // volume_rendering(img, color_val) // Calls Volume rendering script
     // surface_rendering(img, color_val) // Calls surface rendering script
     // tri_planar_rendering(img) // Calls Tri-Planar rendering script
     mpr_rendering(mpr_img) // Calls Multi-Planar Reconstruction rendering script

     console.log(mpr_img.length +"  -  "+ mpr_files.length)
     //if(img.length == files.length){
       // break;
     //}
    //}
    setTimeout(function delay(){
    console.timeEnd('image_render_Time');
    }, 1500);
}).catch(
console.log("Please check the input files again"));
//console.log(img)

}
//////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
