/********************************************************************/
/********************************************************************/
/************** IMAGE-IN VISUALIZER JS File *************************/
/************** Author: Yubraj gupta, email: ygupta@ua.pt ***********/
/********************************************************************/
/********************************************************************/

/*
 * Contain two functions: (1). convertItkToVtkImage (helps to convert itk files into vtk objects)
 * and (2). convertVtkToItkImage (helps to convert vtk objects into itk files).
*/
const { vtkErrorMacro } = vtk.macro;

// see itk.js PixelTypes.js
const ITKJSPixelTypes = {
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

// itk-wasm pixel types from https://github.com/InsightSoftwareConsortium/itk-wasm/blob/master/src/core/PixelTypes.ts
const ITKWASMPixelTypes = {
  Unknown: 'Unknown',
  Scalar: 'Scalar',
  RGB: 'RGB',
  RGBA: 'RGBA',
  Offset: 'Offset',
  Vector: 'Vector',
  Point: 'Point',
  CovariantVector: 'CovariantVector',
  SymmetricSecondRankTensor: 'SymmetricSecondRankTensor',
  DiffusionTensor3D: 'DiffusionTensor3D',
  Complex: 'Complex',
  FixedArray: 'FixedArray',
  Array: 'Array',
  Matrix: 'Matrix',
  VariableLengthVector: 'VariableLengthVector',
  VariableSizeMatrix: 'VariableSizeMatrix',
};

const vtkArrayTypeToItkComponentType = new Map([
  ['Uint8Array', 'uint8'],
  ['Int8Array', 'int8'],
  ['Uint16Array', 'uint16'],
  ['Int16Array', 'int16'],
  ['Uint32Array', 'uint32'],
  ['Int32Array', 'int32'],
  ['Float32Array', 'float32'],
  ['Float64Array', 'float64'],
]);

const itkComponentTypeToVtkArrayType = new Map([
  ['uint8', 'Uint8Array'],
  ['int8', 'Int8Array'],
  ['uint16', 'Uint16Array'],
  ['int16', 'Int16Array'],
  ['uint32', 'Uint32Array'],
  ['int32', 'Int32Array'],
  ['float32', 'Float32Array'],
  ['float64', 'Float64Array'],
]);

/**
 * Converts an itk-wasm Image to a vtk.js vtkImageData.
 *
 * Requires an itk-wasm Image as input.
 */
function convertItkToVtkImage(itkImage, options = {}) {
  const vtkImage = {
    origin: [0, 0, 0],
    spacing: [1, 1, 1],
  };

  const dimensions = [1, 1, 1];
  const direction = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  // Check whether itkImage is an itk.js Image or an itk-wasm Image?
  const isITKWasm = itkImage.direction.data === undefined;
  const ITKPixelTypes = isITKWasm ? ITKWASMPixelTypes : ITKJSPixelTypes;

  for (let idx = 0; idx < itkImage.imageType.dimension; ++idx) {
    vtkImage.origin[idx] = itkImage.origin[idx];
    vtkImage.spacing[idx] = itkImage.spacing[idx];
    dimensions[idx] = itkImage.size[idx];
    for (let col = 0; col < itkImage.imageType.dimension; ++col) {
      // ITK (and VTKMath) use a row-major index axis, but the direction
      // matrix on the vtkImageData is a webGL matrix, which uses a
      // column-major data layout. Transpose the direction matrix from
      // itkImage when instantiating that vtkImageData direction matrix.
      if (isITKWasm) {
        direction[col + idx * 3] =
          itkImage.direction[idx + col * itkImage.imageType.dimension];
      } else {
        direction[col + idx * 3] =
          itkImage.direction.data[idx + col * itkImage.imageType.dimension];
      }
    }
  }

  // Create VTK Image Data
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
  switch (
    isITKWasm
      ? ITKPixelTypes[itkImage.imageType.pixelType]
      : itkImage.imageType.pixelType
  ) {
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
        `Cannot handle unexpected itk-wasm pixel type ${itkImage.imageType.pixelType}`
      );
      return null;
  }

  return imageData;
}

/**
 * Converts a vtk.js vtkImageData to an itk-wasm Image.
 *
 * Requires a vtk.js vtkImageData as input.
 *
 */
function convertVtkToItkImage(vtkImage, copyData = false) {
  const dimension = 3;
  const itkImage = {
    imageType: {
      dimension,
      pixelType: ITKWASMPixelTypes.Scalar,
      componentType: '',
      components: 1,
    },
    name: 'vtkImageData',
    origin: vtkImage.getOrigin(),
    spacing: vtkImage.getSpacing(),
    direction: new Float64Array(9),
    size: vtkImage.getDimensions(),
  };

  const direction = vtkImage.getDirection();

  // Transpose the direction matrix from column-major to row-major
  for (let idx = 0; idx < dimension; ++idx) {
    for (let idy = 0; idy < dimension; ++idy) {
      itkImage.direction[idx + idy * dimension] =
        direction[idy + idx * dimension];
    }
  }

  const pointData = vtkImage.getPointData();

  let vtkArray;
  if (pointData.getTensors() !== null) {
    itkImage.imageType.pixelType = ITKWASMPixelTypes.DiffusionTensor3D;
    vtkArray = pointData.getTensors();
  } else if (pointData.getVectors() != null) {
    itkImage.imageType.pixelType = ITKWASMPixelTypes.Vector;
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

/**********************************************************************/
/*************** Volume Rendering by Yubraj Gupta ********************/
/**********************************************************************/

function volume_rendering(volume_imageData, volume_color_val){

var container = document.getElementById('viewContainer');
const openglRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
const renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
const interactorStyle = vtk.Interaction.Style.vtkInteractorStyleTrackballCamera.newInstance();
const interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
const vtkColorTransferFunction = vtk.Rendering.Core.vtkColorTransferFunction;
const vtkCamera = vtk.Rendering.Core.vtkCamera;
const vtkAnnotatedCubeActor = vtk.Rendering.Core.vtkAnnotatedCubeActor;
const vtkOrientationMarkerWidget = vtk.Interaction.Widgets.vtkOrientationMarkerWidget;

const vtkMouseCameraTrackballPanManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballPanManipulator;
const vtkMouseCameraTrackballZoomManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballZoomManipulator;
const vtkInteractorStyleManipulator = vtk.Interaction.Style.vtkInteractorStyleManipulator;
const vtkMouseCameraTrackballRotateManipulator = vtk.Interaction.Manipulators.vtkMouseCameraTrackballRotateManipulator;
const { vec3, vec2, quat, mat4} = glMatrix;

container.style.display = 'flex';
container.style.position = 'static';
openglRenderWindow.setContainer(container);
const { width, height } = container.getBoundingClientRect();
openglRenderWindow.setSize(width, height);
renderWindow.addView(openglRenderWindow);

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

function ijkPlanesToWorld(image, planes= [number, number], axis= 0 | 1 | 2) {
let normal = [0, 0, 0];
let origin = [0, 0, 0];

// for first plane
normal[axis] = 1;
origin[axis] = planes[0];
origin = image.indexToWorld(origin);
rotateVe = (vec) => {
    out = [0, 0, 0];
    vec3.transformMat3(out, vec, image.getDirection());
    return out;
};

const firstPlane = vtkPlane.newInstance({ normal: rotateVe([normal[0], normal[1], normal[2]]), origin });

// second plane
normal = [0, 0, 0];
origin = [0, 0, 0];

normal[axis] = -1;
origin[axis] = planes[1];
origin = image.indexToWorld(origin);
rotateVe = (vec) => {
    out = [0, 0, 0];
    vec3.transformMat3(out, vec, image.getDirection());
    return out;
};

const secondPlane = vtkPlane.newInstance({  normal: rotateVe([normal[0], normal[1], normal[2]]), origin });

    return [firstPlane, secondPlane];
}

const hex2rgba = (hex, alpha = 1) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

const HEX_Values = volume_color_val;

volume_opacity_val = []
volume_sample_Distance = []
volume_visibility_control = []
volume_imageData_obj = volume_imageData

   for (i = 0; i < volume_imageData.length; i++){

            // Call the Picked Color
            HEX_color_VALUES = HEX_Values[i]

            // Convert Picked Hex color into RGBA string format
            RGB_value = hex2rgba(HEX_color_VALUES)

            // Convert string RBGA to array RGBA
            rgbInt = Array.from(RGB_value.matchAll(/\d+\.?\d*/g), c=> +c[0])

            // Define the Volume rendering Functions
            volume_vtk = vtk.Rendering.Core.vtkVolume.newInstance();
            volumeMapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();
            volumeProperty = vtk.Rendering.Core.vtkVolumeProperty.newInstance();
            ofun = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
            ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
            vtkPlane = vtk.Common.DataModel.vtkPlane;

            // Load the Input
            const dataArray = volume_imageData[i].getPointData().getScalars() || volume_imageData[i].getPointData().getArrays()[0];
            const dataRange = dataArray.getRange();
            dataRange_1 = volume_imageData[i].getPointData().getScalars().getRange();

            dimensions = volume_imageData[i].getDimensions()

            // Calculating Pixel range
            ii_0 = parseInt(dataRange[0])
            ii_mid = parseInt(dataRange[1] / 2)
            ii_1 = parseInt(dataRange[1])

            // Define PieceWise transfer function
            ofun.removeAllPoints();
            ofun.addPoint(ii_0, 0.0);
            ofun.addPoint(ii_1, 1.0);

            min = ii_0;
            max = ii_1;
            temp = 0

            // Define Color Transfer Function
            ctfun.addRGBPoint(rgbInt[3] * 1, (rgbInt[0]/256.), (rgbInt[1]/256.), (rgbInt[2]/256.))

            // create color and opacity transfer functions
            volumeProperty.setRGBTransferFunction(0, ctfun);
            volumeProperty.setScalarOpacity(0, ofun);
            volumeProperty.setShade(true);
            volumeProperty.setInterpolationTypeToFastLinear();
            volumeProperty.setAmbient(0.2);
            volumeProperty.setDiffuse(0.7);
            volumeProperty.setSpecular(0.3);
            volumeProperty.setSpecularPower(8.0);
            volumeProperty.setOpacityMode(0, 20);
            volumeProperty.setIndependentComponents(true);
            volumeProperty.setUseGradientOpacity(0, true);
            volumeProperty.setGradientOpacityMinimumValue(0, 0);
            volumeProperty.setGradientOpacityMinimumOpacity(0, 0);
            volumeProperty.setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.1);
            volumeProperty.setGradientOpacityMaximumOpacity(0, 1.0);

            // set origin of a data to zero
            volume_imageData[i].setOrigin(0.0, 0.0, 0.0)
            image_origin = volume_imageData[i].getOrigin();

            Direction = volume_imageData[i].getDirection();

            img_origin_X = image_origin[0];
            img_origin_Y = image_origin[1];
            img_origin_Z = image_origin[2];

            const extent = volume_imageData[i].getExtent();
            const spacing = volume_imageData[i].getSpacing();

            const sizeX = extent[1] * spacing[0];
            const sizeY = extent[3] * spacing[1];
            const sizeZ = extent[5] * spacing[2];

            const xPlanes = [0, extent[1]-1];
            const yPlanes = [0, extent[3]-1];
            const zPlanes = [0, extent[3]-1];

            [firstPlane_x, secondPlane_x_inv] = ijkPlanesToWorld(volume_imageData[i], xPlanes, 0);
            [firstPlane_y, secondPlane_y_inv] = ijkPlanesToWorld(volume_imageData[i], yPlanes, 1);
            [firstPlane_z, secondPlane_z_inv] = ijkPlanesToWorld(volume_imageData[i], zPlanes, 2);

            // Call the function of ClipPlane
            const clipPlaneX = vtkPlane.newInstance();
            const clipPlaneX_inv = vtkPlane.newInstance();
            const clipPlaneY = vtkPlane.newInstance();
            const clipPlaneY_inv = vtkPlane.newInstance();
            const clipPlaneZ = vtkPlane.newInstance();
            const clipPlaneZ_inv = vtkPlane.newInstance();

            clipPlaneNormalX = [-1, 0, 0];
            clipPlaneNormalX_inv = [1, 0, 0];
            clipPlaneNormalY = [0, -1, 0];
            clipPlaneNormalY_inv = [0, 1, 0];
            clipPlaneNormalZ = [0, 0, -1];
            clipPlaneNormalZ_inv = [0, 0, 1];

            clipPlane1PositionX = -((sizeX/ 1) ) ;
            clipPlane2PositionX_inv =  ((sizeX/ 0) ) ;
            clipPlane2PositionY =  -((sizeX/ 1) ) ;
            clipPlane2PositionY_inv =  ((sizeX/ 0) ) ;
            clipPlane2PositionZ =  -((sizeZ/ 1) ) ;
            clipPlane2PositionZ_inv =  ((sizeZ/ 0) ) ;

            clipPlaneX.setNormal(secondPlane_x_inv.getNormal());
            clipPlaneX.setOrigin(secondPlane_x_inv.getOrigin());

            clipPlaneX_inv.setNormal(firstPlane_x.getNormal());
            clipPlaneX_inv.setOrigin(firstPlane_x.getOrigin());

            clipPlaneY.setNormal(secondPlane_y_inv.getNormal());
            clipPlaneY.setOrigin(secondPlane_y_inv.getOrigin());

            clipPlaneY_inv.setNormal(firstPlane_y.getNormal());
            clipPlaneY_inv.setOrigin(firstPlane_y.getOrigin());

            clipPlaneZ.setNormal(secondPlane_z_inv.getNormal());
            clipPlaneZ.setOrigin(secondPlane_z_inv.getOrigin());

            clipPlaneZ_inv.setNormal(firstPlane_z.getNormal());
            clipPlaneZ_inv.setOrigin(firstPlane_z.getOrigin());

            volumeMapper.setInputData(volume_imageData[i]);

            // Adding above created six planes into mapper
            volumeMapper.addClippingPlane(clipPlaneX);
            volumeMapper.addClippingPlane(clipPlaneX_inv);
            volumeMapper.addClippingPlane(clipPlaneY);
            volumeMapper.addClippingPlane(clipPlaneY_inv);
            volumeMapper.addClippingPlane(clipPlaneZ);
            volumeMapper.addClippingPlane(clipPlaneZ_inv);

            volumeMapper.setSampleDistance(0.25);
            volumeMapper.setMaximumSamplesPerRay(true);
            volumeMapper.setAutoAdjustSampleDistances(true);

            // Define vtkVolume
            volume_vtk.setMapper(volumeMapper);
            volume_vtk.setProperty(volumeProperty);

            renderer.addActor(volume_vtk);

            let el = document.querySelector('.planePositionX');
            el.setAttribute('min', ((-sizeX) + img_origin_X));
            el.setAttribute('max', img_origin_X);
            el.setAttribute('value', ((-sizeX) + img_origin_X));

            el = document.querySelector('.planePositionX_inv');
            el.setAttribute('min', img_origin_X);
            el.setAttribute('max', (sizeX + img_origin_X));
            el.setAttribute('value', img_origin_X);

            el = document.querySelector('.planePositionY');
            el.setAttribute('min', ((-sizeY) + img_origin_Y));
            el.setAttribute('max', img_origin_Y);
            el.setAttribute('value', ((-sizeY) + img_origin_Y));

            el = document.querySelector('.planePositionY_inv');
            el.setAttribute('min', img_origin_Y);
            el.setAttribute('max', (sizeY + img_origin_Y));
            el.setAttribute('value', img_origin_Y);

            el = document.querySelector('.planePositionZ');
            el.setAttribute('min', ((-sizeZ) + img_origin_Z));
            el.setAttribute('max', img_origin_Z);
            el.setAttribute('value', ((-sizeZ) + img_origin_Z));

            el = document.querySelector('.planePositionZ_inv');
            el.setAttribute('min', img_origin_Z);
            el.setAttribute('max', (sizeZ + img_origin_Z));
            el.setAttribute('value', img_origin_Z);

            document.querySelector('.planePositionX').addEventListener('input', (e) => {
            clipPlane1PositionX = Number(e.target.value);
            const clipPlaneOriginX = [clipPlane1PositionX * clipPlaneNormalX[0], clipPlane1PositionX * clipPlaneNormalX[1], clipPlane1PositionX * clipPlaneNormalX[2], ];
            clipPlaneX.setOrigin(clipPlaneOriginX);
            renderWindow.render();
            });

            document.querySelector('.planePositionX_inv').addEventListener('input', (e) => {
            clipPlane1PositionX_inv = Number(e.target.value);
            const clipPlaneOriginX_inv = [clipPlane1PositionX_inv * clipPlaneNormalX_inv[0], clipPlane1PositionX_inv * clipPlaneNormalX_inv[1], clipPlane1PositionX_inv * clipPlaneNormalX_inv[2], ];
            clipPlaneX_inv.setOrigin(clipPlaneOriginX_inv);
            renderWindow.render();
            });

            document.querySelector('.planePositionY').addEventListener('input', (e) => {
            clipPlane1PositionY = Number(e.target.value);
            const clipPlaneOriginY = [clipPlane1PositionY * clipPlaneNormalY[0], clipPlane1PositionY * clipPlaneNormalY[1], clipPlane1PositionY * clipPlaneNormalY[2], ];
            clipPlaneY.setOrigin(clipPlaneOriginY);
            renderWindow.render();
            });

            document.querySelector('.planePositionY_inv').addEventListener('input', (e) => {
            clipPlane1PositionY_inv = Number(e.target.value);
            const clipPlaneOriginY_inv = [clipPlane1PositionY_inv * clipPlaneNormalY_inv[0],clipPlane1PositionY_inv * clipPlaneNormalY_inv[1],clipPlane1PositionY_inv * clipPlaneNormalY_inv[2], ];
            clipPlaneY_inv.setOrigin(clipPlaneOriginY_inv);
            renderWindow.render();
            });

            document.querySelector('.planePositionZ').addEventListener('input', (e) => {
            clipPlane1PositionZ = Number(e.target.value);
            const clipPlaneOriginZ = [clipPlane1PositionZ * clipPlaneNormalZ[0], clipPlane1PositionZ * clipPlaneNormalZ[1], clipPlane1PositionZ * clipPlaneNormalZ[2], ];
            clipPlaneZ.setOrigin(clipPlaneOriginZ);
            renderWindow.render();
            });

            document.querySelector('.planePositionZ_inv').addEventListener('input', (e) => {
            clipPlane1PositionZ_inv = Number(e.target.value);
            const clipPlaneOriginZ_inv = [clipPlane1PositionZ_inv * clipPlaneNormalZ_inv[0], clipPlane1PositionZ_inv * clipPlaneNormalZ_inv[1], clipPlane1PositionZ_inv * clipPlaneNormalZ_inv[2], ];
            clipPlaneZ_inv.setOrigin(clipPlaneOriginZ_inv);
            renderWindow.render();
            });

            // Create a AXES
            const axes = vtkAnnotatedCubeActor.newInstance();
            axes.setDefaultStyle({text: '+X', fontStyle: 'bold', fontFamily: 'Arial', fontColor: 'white',
            faceColor: createRGBStringFromRGBValues(viewColors[0]), edgeThickness: 0.1, edgeColor: 'white',
            resolution: 400,
            });

            axes.setXMinusFaceProperty({text: '-X',faceColor: createRGBStringFromRGBValues(viewColors[0]),
            });

            axes.setYPlusFaceProperty({text: '+Y',faceColor: createRGBStringFromRGBValues(viewColors[1]),
            });

            axes.setYMinusFaceProperty({text: '-Y',faceColor: createRGBStringFromRGBValues(viewColors[1]),
            });

            axes.setZPlusFaceProperty({text: '+Z',faceColor: createRGBStringFromRGBValues(viewColors[2]),
            });

            axes.setZMinusFaceProperty({text: '-Z',faceColor: createRGBStringFromRGBValues(viewColors[2]),
            });

            // create orientation widget
            orientationWidget = vtkOrientationMarkerWidget.newInstance({actor: axes, interactor: interactor});
            setTimeout(() => {
            orientationWidget.setEnabled(true);
            orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
            orientationWidget.setViewportSize(0.15);
            orientationWidget.setMinPixelSize(20);
            orientationWidget.setMaxPixelSize(80);
            }, 1);

            window.onresize = () => {orientationWidget.updateViewport();}

            volume_opacity_val[i] = volumeProperty
            volume_sample_Distance[i] = volumeMapper
            volume_visibility_control[i] = volume_vtk
            volume_imageData_obj[i] = volume_imageData[i]
      }

for(e=0; e<volume_imageData.length; e++){
    volume_idOpacity = "#setGradientOpacity" + e
    volume_idDistance = "#setSampleDistance" + e
    volume_idblendMode = "#blendMode" + e
    volume_idVisibility = "#visibility" + e
    volume_idColor = "#vol_color" + e
    volume_id_Z_scale  = "#Slider_scale" + e
    volume_id_shade = "#shade" + e
    volume_id_scalar_opacity = "#setScalarOpacityUnitDistance" + e

    d = e
    trigger_changes_volume(volume_id_scalar_opacity, volume_id_shade, volume_idVisibility, volume_id_Z_scale, volume_visibility_control[d], volume_imageData_obj[d], volume_idOpacity, volume_idDistance, volume_opacity_val[d], volume_sample_Distance[d], renderWindow, volume_idblendMode, volume_idColor)
};

//////////////////////////////////////////////////////////////////////////////////////
const center = getCenterOfScene(renderer);
const camera = vtkCamera.newInstance();
// prevent zoom manipulator from messing with our focal point
camera.getFocalPoint()
camera.elevation(70);

renderWindow.addRenderer(renderer);
interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(container);

const PanSelector = vtkMouseCameraTrackballPanManipulator.newInstance({ button: 3 },);
const ZoomSelector = vtkMouseCameraTrackballZoomManipulator.newInstance({ scrollEnabled: true, dragEnabled: false },);
const Rotate = vtkMouseCameraTrackballRotateManipulator.newInstance({ button: 1 },);

const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addMouseManipulator(PanSelector);
iStyle.addMouseManipulator(ZoomSelector);
iStyle.addMouseManipulator(Rotate);
iStyle.setCenterOfRotation(center);

renderWindow.getInteractor().setInteractorStyle(iStyle);

// Change canvas background color
var Reset_Background = document.getElementById('Reset_Background');
count = 0;
Reset_Background.onclick = function() {
    count +=1;
    console.log(count)
    if (count == 1) {
        renderer.setBackground(0.5, 0.5, 0.5); // GRAY
        renderWindow.render();
    } else if (count == 2) {
        renderer.setBackground(1, 1, 1); // WHITE
        renderWindow.render();
    } else if (count == 3){
        renderer.setBackground(0, 0, 0);  // BLACK
        renderWindow.render();
        console.log(count)
        count = 0;
    }
};

renderer.resetCamera();
renderer.resetCameraClippingRange();
renderWindow.render();
volume_vtk.setVisibility(true);

// Canvas reset
const Reset_canvas = document.getElementById('Reset_canvas');
Reset_canvas.addEventListener('click', () => {
  renderer.resetCamera();
  renderWindow.render();
});

}

// function to convert HEX to RGBA string
const hex2rgba = (hex, alpha = 1) => {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
};

// function to trigger switches
function trigger_changes_volume(volume_id_scalar_opacity, volume_id_shade, volume_idVisibility, volume_id_Z_scale, volume_visibility_control, volume_imageData_obj, volume_idOpacity, volume_idDistance, volume_opacity_val, volume_sample_Distance, renderWindow, volume_idblendMode, volume_idColor) {

    // Control Gradient Opacity
    $(volume_idOpacity).change(function() {
      newVal_OPA = this.value
       volume_opacity_val.setGradientOpacityMaximumOpacity(0, newVal_OPA); // Gradient
       renderWindow.render();
       console.log(newVal_OPA);
    });

    // Control Scalar Opacity
    $(volume_id_scalar_opacity).change(function() {
      new_SD = this.value
       //console.log(new_SD)
       volume_opacity_val.setScalarOpacityUnitDistance(0, new_SD);
       renderWindow.render();
    });

      // Control Sample Distance
    $(volume_idDistance).change(function() {
      new_Val_SD = this.value
       console.log(new_Val_SD)
       volume_sample_Distance.setSampleDistance(new_Val_SD);
       renderWindow.render();
    });

    // Control Blending Mode
    $( volume_idblendMode ).change(function() {
        new_Val_blen = parseInt(this.value, 10);
        volume_sample_Distance.setBlendMode(new_Val_blen);
        renderWindow.render();
    });

    // Control Image Visibility
    var VIS = false;
    $(volume_idVisibility).on('click', function() {
        volume_visibility_control.setVisibility(VIS);
        renderWindow.render();
        VIS = !(VIS);
    });

    // Control Image Shade
    var SHADE = false;
    $(volume_id_shade).on('click', function() {
        volume_opacity_val.setShade(SHADE);
        renderWindow.render();
        SHADE = !(SHADE);
    });

    // Control the color of the image
    const colorTFun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
    const vol_colorChange = document.querySelector(volume_idColor);

    vol_colorChange.addEventListener('input', (e) => {
    volumeColor = hex2rgba(e.target.value);
    rgba2Int = Array.from(volumeColor.matchAll(/\d+\.?\d*/g), c=> +c[0])
    colorTFun.addRGBPoint(rgba2Int[3] * 1, (rgba2Int[0]/256.), (rgba2Int[1]/256.), (rgba2Int[2]/256.))
    volume_opacity_val.setRGBTransferFunction(0, colorTFun);
    renderWindow.render();
    });

    // Control the Z-SCALE of each volume
    extent = volume_imageData_obj.getExtent();
    const sizeZ = extent[5];
    img_origin_Z = 0;

    $(volume_id_Z_scale).change(function() {

        newVal = this.value
        console.log(newVal)
        volume_visibility_control.setScale(1.0, 1.0, newVal)

         el = document.querySelector('.planePositionZ');
         el.setAttribute('min', ((-sizeZ*newVal) + img_origin_Z));
         el.setAttribute('max', img_origin_Z);
         el.setAttribute('value', ((-sizeZ*newVal) + img_origin_Z));

         el = document.querySelector('.planePositionZ_inv');
         el.setAttribute('min', img_origin_Z);
         el.setAttribute('max', (sizeZ*newVal + img_origin_Z));
         el.setAttribute('value', img_origin_Z);

         renderWindow.render();
    });

}

/**********************************************************************/
/*************** Surface Rendering by Yubraj Gupta ********************/
/**********************************************************************/

function surface_rendering(surface_imageData, surface_color_val){

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
const { vec3, vec2, quat, mat4} = glMatrix;

container.style.display = 'flex';
openglRenderWindow.setContainer(container);
const { width, height } = container.getBoundingClientRect();
openglRenderWindow.setSize(width, height);
renderWindow.addView(openglRenderWindow);

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

function getCroppingPlanes(imageData, ijkPlanes) {
  const rotation = quat.create();
  mat4.getRotation(rotation, imageData.getIndexToWorld());

  const rotateVec = (vec) => {
    const out = [0, 0, 0];
    vec3.transformMat3(out, vec, imageData.getDirection());
    return out;
  };

  const [iMin, iMax, jMin, jMax, kMin, kMax] = ijkPlanes;
  const origin = imageData.indexToWorld([iMin, jMin, kMin]);
  // opposite corner from origin
  const corner = imageData.indexToWorld([iMax, jMax, kMax]);
  const surfacePlanes = [
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([1, 0, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([-1, 0, 0]), origin: corner }),
    // Y min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 1, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, -1, 0]), origin: corner }),
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 0, 1]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, 0, -1]), origin: corner })
  ];

  return surfacePlanes;
}

// Converts the HTML color picker value into usable RGB
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const HEX_Values = surface_color_val;

surface_opacity_val = []
surface_iso = []
surface_iso_dataRange = []
surface_imageData_obj = surface_imageData

    for (a = 0; a < surface_imageData.length; a++){

        HEX_color_VALUES = HEX_Values[a]
        RGB_value = hexToRgb(HEX_color_VALUES)

        marchingC = vtk.Filters.General.vtkImageMarchingCubes.newInstance({contourValue: 0.0, computeNormals: true, mergePoints: true });
        actor = vtk.Rendering.Core.vtkActor.newInstance();
        mapper = vtk.Rendering.Core.vtkMapper.newInstance();
        ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
        vtkPlane = vtk.Common.DataModel.vtkPlane;

        dataRange = surface_imageData[a].getPointData().getScalars().getRange();
        firstIsoValue = (dataRange[0] + dataRange[1]) / 3;

        marchingC.setInputData(surface_imageData[a]);
        marchingC.setContourValue((dataRange[0] + dataRange[1]) / 3);

        mapper.setInputConnection(marchingC.getOutputPort());

        mapper.setScalarVisibility(true);
        mapper.setScalarRange(0, 10);
        mapper.setResolveCoincidentTopology(true);
        actor.setMapper(mapper);

        actor.getProperty().setColor(RGB_value.r/256., RGB_value.g/256., RGB_value.b/256.)
        actor.getProperty().setLighting(true);
        actor.getProperty().setSpecular(0.3);
        actor.getProperty().setSpecularPower(20);
        actor.getProperty().setOpacity(0.9);
        actor.getProperty().setBackfaceCulling(true);
        actor.getProperty().setRepresentationToSurface();

        // Add actor on renderer
        renderer.addActor(actor);

        surface_imageData[a].setOrigin(0.0, 0.0, 0.0)
        sur_image_origin = surface_imageData[a].getOrigin();

        sur_img_origin_X = sur_image_origin[0];
        sur_img_origin_Y = sur_image_origin[1];
        sur_img_origin_Z = sur_image_origin[2];

        const sur_extent = surface_imageData[a].getExtent();
        const sur_spacing = surface_imageData[a].getSpacing();

        const sur_sizeX = sur_extent[1] * sur_spacing[0];
        const sur_sizeY = sur_extent[3] * sur_spacing[1];
        const sur_sizeZ = sur_extent[5] * sur_spacing[2];

        surfacePlanes = getCroppingPlanes(surface_imageData[a], sur_extent);

        // Call the function of ClipPlane
        const sur_clipPlaneX = vtkPlane.newInstance();
        const sur_clipPlaneX_inv = vtkPlane.newInstance();
        const sur_clipPlaneY = vtkPlane.newInstance();
        const sur_clipPlaneY_inv = vtkPlane.newInstance();
        const sur_clipPlaneZ = vtkPlane.newInstance();
        const sur_clipPlaneZ_inv = vtkPlane.newInstance();


        const sur_clipPlaneNormalX = [-1, 0, 0];
        const sur_clipPlaneNormalX_inv = [1, 0, 0];
        const sur_clipPlaneNormalY = [0, -1, 0];
        const sur_clipPlaneNormalY_inv = [0, 1, 0];
        const sur_clipPlaneNormalZ = [0, 0, -1];
        const sur_clipPlaneNormalZ_inv = [0, 0, 1];

        // Need to be same for all clipPlane
        sur_clipPlane1PositionX = -((sur_sizeX/ 1));
        sur_clipPlane2PositionX_inv =  ((sur_sizeX/ 0));
        sur_clipPlane2PositionY =  -((sur_sizeX/ 1));
        sur_clipPlane2PositionY_inv =  ((sur_sizeX/ 0));
        sur_clipPlane2PositionZ =  -((sur_sizeZ/ 1));
        sur_clipPlane2PositionZ_inv =  ((sur_sizeZ/ 0));


        sur_clipPlaneX.setNormal(surfacePlanes[1].getNormal());
        sur_clipPlaneX.setOrigin(surfacePlanes[1].getOrigin());

        sur_clipPlaneX_inv.setNormal(surfacePlanes[0].getNormal());
        sur_clipPlaneX_inv.setOrigin(surfacePlanes[0].getOrigin());

        sur_clipPlaneY.setNormal(surfacePlanes[3].getNormal());
        sur_clipPlaneY.setOrigin(surfacePlanes[3].getOrigin());

        sur_clipPlaneY_inv.setNormal(surfacePlanes[2].getNormal());
        sur_clipPlaneY_inv.setOrigin(surfacePlanes[2].getOrigin());

        sur_clipPlaneZ.setNormal(surfacePlanes[5].getNormal());
        sur_clipPlaneZ.setOrigin(surfacePlanes[5].getOrigin());

        sur_clipPlaneZ_inv.setNormal(surfacePlanes[4].getNormal());
        sur_clipPlaneZ_inv.setOrigin(surfacePlanes[4].getOrigin());

        // Adding above created six planes inside mapper
        mapper.addClippingPlane(sur_clipPlaneX);
        mapper.addClippingPlane(sur_clipPlaneX_inv);
        mapper.addClippingPlane(sur_clipPlaneY);
        mapper.addClippingPlane(sur_clipPlaneY_inv);
        mapper.addClippingPlane(sur_clipPlaneZ);
        mapper.addClippingPlane(sur_clipPlaneZ_inv);

        let gl = document.querySelector('.planePositionX');
        gl.setAttribute('min', ((-sur_sizeX) + sur_img_origin_X));
        gl.setAttribute('max', sur_img_origin_X);
        gl.setAttribute('value', ((-sur_sizeX) + sur_img_origin_X));

        gl = document.querySelector('.planePositionX_inv');
        gl.setAttribute('min', sur_img_origin_X);
        gl.setAttribute('max', (sur_sizeX + sur_img_origin_X));
        gl.setAttribute('value', sur_img_origin_X);

        gl = document.querySelector('.planePositionY');
        gl.setAttribute('min', ((-sur_sizeY) + sur_img_origin_Y));
        gl.setAttribute('max', sur_img_origin_Y);
        gl.setAttribute('value', ((-sur_sizeY) + sur_img_origin_Y));

        gl = document.querySelector('.planePositionY_inv');
        gl.setAttribute('min', sur_img_origin_Y);
        gl.setAttribute('max', (sur_sizeY + sur_img_origin_Y));
        gl.setAttribute('value', sur_img_origin_Y);

        gl = document.querySelector('.planePositionZ');
        gl.setAttribute('min', ((-sur_sizeZ) + sur_img_origin_Z));
        gl.setAttribute('max', sur_img_origin_Z);
        gl.setAttribute('value', ((-sur_sizeZ) + sur_img_origin_Z));

        gl = document.querySelector('.planePositionZ_inv');
        gl.setAttribute('min', sur_img_origin_Z);
        gl.setAttribute('max', (sur_sizeZ + sur_img_origin_Z));
        gl.setAttribute('value', sur_img_origin_Z);

        document.querySelector('.planePositionX').addEventListener('input', (e) => {
        sur_clipPlane1PositionX = Number(e.target.value);
        const sur_clipPlaneOriginX = [sur_clipPlane1PositionX * sur_clipPlaneNormalX[0], sur_clipPlane1PositionX * sur_clipPlaneNormalX[1], sur_clipPlane1PositionX * sur_clipPlaneNormalX[2], ];
        sur_clipPlaneX.setOrigin(sur_clipPlaneOriginX);
        renderWindow.render();
        });

        document.querySelector('.planePositionX_inv').addEventListener('input', (e) => {
        sur_clipPlane1PositionX_inv = Number(e.target.value);
        const sur_clipPlaneOriginX_inv = [sur_clipPlane1PositionX_inv * sur_clipPlaneNormalX_inv[0], sur_clipPlane1PositionX_inv * sur_clipPlaneNormalX_inv[1], sur_clipPlane1PositionX_inv * sur_clipPlaneNormalX_inv[2], ];
        sur_clipPlaneX_inv.setOrigin(sur_clipPlaneOriginX_inv);
        renderWindow.render();
        });

        document.querySelector('.planePositionY').addEventListener('input', (e) => {
        sur_clipPlane1PositionY = Number(e.target.value);
        const sur_clipPlaneOriginY = [sur_clipPlane1PositionY * sur_clipPlaneNormalY[0], sur_clipPlane1PositionY * sur_clipPlaneNormalY[1], sur_clipPlane1PositionY * sur_clipPlaneNormalY[2], ];
        sur_clipPlaneY.setOrigin(sur_clipPlaneOriginY);
        renderWindow.render();
        });

        document.querySelector('.planePositionY_inv').addEventListener('input', (e) => {
        sur_clipPlane1PositionY_inv = Number(e.target.value);
        const sur_clipPlaneOriginY_inv = [sur_clipPlane1PositionY_inv * sur_clipPlaneNormalY_inv[0], sur_clipPlane1PositionY_inv * sur_clipPlaneNormalY_inv[1], sur_clipPlane1PositionY_inv * sur_clipPlaneNormalY_inv[2], ];
        sur_clipPlaneY_inv.setOrigin(sur_clipPlaneOriginY_inv);
        renderWindow.render();
        });

        document.querySelector('.planePositionZ').addEventListener('input', (e) => {
        sur_clipPlane1PositionZ = Number(e.target.value);
        const sur_clipPlaneOriginZ = [sur_clipPlane1PositionZ * sur_clipPlaneNormalZ[0], sur_clipPlane1PositionZ * sur_clipPlaneNormalZ[1], sur_clipPlane1PositionZ * sur_clipPlaneNormalZ[2], ];
        sur_clipPlaneZ.setOrigin(sur_clipPlaneOriginZ);
        renderWindow.render();
        });

        document.querySelector('.planePositionZ_inv').addEventListener('input', (e) => {
        sur_clipPlane1PositionZ_inv = Number(e.target.value);
        const sur_clipPlaneOriginZ_inv = [sur_clipPlane1PositionZ_inv * sur_clipPlaneNormalZ_inv[0], sur_clipPlane1PositionZ_inv * sur_clipPlaneNormalZ_inv[1], sur_clipPlane1PositionZ_inv * sur_clipPlaneNormalZ_inv[2], ];
        sur_clipPlaneZ_inv.setOrigin(sur_clipPlaneOriginZ_inv);
        renderWindow.render();
        });

        const axes = vtkAnnotatedCubeActor.newInstance();
        axes.setDefaultStyle({text: '+X', fontStyle: 'bold', fontFamily: 'Arial', fontColor: 'white',
        faceColor: createRGBStringFromRGBValues(viewColors[0]), edgeThickness: 0.1, edgeColor: 'white',
        resolution: 400,
        });

        axes.setXMinusFaceProperty({text: '-X',faceColor: createRGBStringFromRGBValues(viewColors[0]),
        });

        axes.setYPlusFaceProperty({text: '+Y',faceColor: createRGBStringFromRGBValues(viewColors[1]),
        });

        axes.setYMinusFaceProperty({text: '-Y',faceColor: createRGBStringFromRGBValues(viewColors[1]),
        });

        axes.setZPlusFaceProperty({text: '+Z',faceColor: createRGBStringFromRGBValues(viewColors[2]),
        });

        axes.setZMinusFaceProperty({text: '-Z',faceColor: createRGBStringFromRGBValues(viewColors[2]),
        });

        // create orientation widget
        orientationWidget = vtkOrientationMarkerWidget.newInstance({actor: axes, interactor: interactor});
        setTimeout(() => {
        orientationWidget.setEnabled(true);
        orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
        orientationWidget.setViewportSize(0.15);
        orientationWidget.setMinPixelSize(20);
        orientationWidget.setMaxPixelSize(80);
        }, 1);

        window.onresize = () => {orientationWidget.updateViewport();}

        surface_opacity_val[a] = actor
        surface_iso[a] = marchingC
        surface_iso_dataRange[a]  = dataRange
        surface_imageData_obj[a] = surface_imageData[a]
    }

// slider for a opacity and Iso values
for(b=0; b<surface_imageData.length; b++){
    surface_idOpacity = "#setOpacity"+ b
    surface_idISO = "#isoValue"+ b
    surface_idEDVSI = "#sur_edge_visibility"+ b
    surface_idColor = "#favcolor"+ b
    surface_id_Z_Scale = "#sur_Slider_scale"+ b
    z = b
    trigger_changes_iso(surface_idOpacity, surface_id_Z_Scale, surface_imageData_obj[z], surface_idEDVSI, surface_idColor, surface_opacity_val[z], surface_idISO, surface_iso[z], surface_iso_dataRange[z], renderWindow)
};

const center = getCenterOfScene(renderer);
const camera = vtkCamera.newInstance();

camera.getFocalPoint()
camera.elevation(70);

renderWindow.addRenderer(renderer);

interactor.setView(openglRenderWindow);
interactor.initialize();
interactor.bindEvents(container);

const PanSelector = vtkMouseCameraTrackballPanManipulator.newInstance({ button: 3 },);
const ZoomSelector = vtkMouseCameraTrackballZoomManipulator.newInstance({ scrollEnabled: true, dragEnabled: false },);
const Rotate = vtkMouseCameraTrackballRotateManipulator.newInstance({ button: 1 },);

const iStyle = vtkInteractorStyleManipulator.newInstance();
iStyle.addMouseManipulator(PanSelector);
iStyle.addMouseManipulator(ZoomSelector);
iStyle.addMouseManipulator(Rotate);
iStyle.setCenterOfRotation(center);

renderWindow.getInteractor().setInteractorStyle(iStyle);

renderer.resetCamera();
renderWindow.render();

// EdgeVisibility has to be turned off to load the image at beginning
actor.getProperty().setEdgeVisibility(false);

// Change canvas background color
var Reset_Background = document.getElementById('Reset_Background');
count = 0;
Reset_Background.onclick = function() {
    count +=1;
    console.log(count)
    if (count == 1) {
        renderer.setBackground(0.5, 0.5, 0.5); // GRAY
        renderWindow.render();
    } else if (count == 2) {
        renderer.setBackground(1, 1, 1); // WHITE
        renderWindow.render();
    } else if (count == 3){
        renderer.setBackground(0, 0, 0);  // BLACK
        renderWindow.render();
        console.log(count)
        count = 0;
    }
};

// DISPLAY RESET
const Reset_canvas = document.getElementById('Reset_canvas');
Reset_canvas.addEventListener('click', () => {
  renderer.resetCamera();
  renderWindow.render();
});


}

function trigger_changes_iso(surface_idOpacity, surface_id_Z_Scale, surface_imageData_obj, surface_idEDVSI, surface_idColor, surface_opacity_val, surface_idISO, surface_iso, surface_iso_dataRange, renderWindow){

    // Control Sample Opacity
    $(surface_idOpacity).change(function() {
      newVal = this.value
       surface_opacity_val.getProperty().setOpacity(newVal)
       renderWindow.render()
    });

    // Control Iso Contour Value
    function updateIsoValue(s) {
      const isoValue = Number(s.target.value);
      surface_iso.setContourValue(isoValue);
      renderWindow.render();
    }

    const el = document.querySelector(surface_idISO);
    el.setAttribute('min', surface_iso_dataRange[0]);
    el.setAttribute('max', surface_iso_dataRange[1]);
    el.setAttribute('value', ((surface_iso_dataRange[0] + surface_iso_dataRange[1]) / 3));
    el.addEventListener('input', updateIsoValue);

    var edge = true;
    $(surface_idEDVSI).on('click', function() {
        surface_opacity_val.getProperty().setEdgeVisibility(edge);
        renderWindow.render();
        edge = !(edge);
    });

    // Converts the HTML color picker value into usable RGB
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Control the color of the image
    const colorChange = document.querySelector(surface_idColor);
    colorChange.addEventListener('input', (e) => {
    const color = hexToRgb(e.target.value);
    surface_opacity_val.getProperty().setColor(color.r/256., color.g/256., color.b/256.)
    surface_opacity_val.getProperty().setDiffuseColor(color.r / 255.0, color.g / 255.0, color.b / 255.0);
    surface_opacity_val.getProperty().setAmbientColor(color.r / 255.0, color.g / 255.0, color.b / 255.0);
    renderWindow.render();
    });

    // Control the scale of the surface
    sur_extentt = surface_imageData_obj.getExtent();
    sur_sizeZZ = sur_extentt[5];
    sur_img_origin_ZZ = 0;

    ///////////////////////
    $(surface_id_Z_Scale).change(function() {

        sur_Z_newVal = this.value
        console.log(sur_Z_newVal)
        surface_opacity_val.setScale(1.0, 1.0, sur_Z_newVal)

         let e_l = document.querySelector('.planePositionZ');
         e_l.setAttribute('min', ((-sur_sizeZZ * sur_Z_newVal) + sur_img_origin_ZZ));
         e_l.setAttribute('max', sur_img_origin_ZZ);
         e_l.setAttribute('value', ((-sur_sizeZZ * sur_Z_newVal) + sur_img_origin_ZZ));

         e_l = document.querySelector('.planePositionZ_inv');
         e_l.setAttribute('min', sur_img_origin_ZZ);
         e_l.setAttribute('max', (sur_sizeZZ * sur_Z_newVal + sur_img_origin_ZZ));
         e_l.setAttribute('value', sur_img_origin_ZZ);

         renderWindow.render();
    });

}

/**********************************************************************/
/*************** Tri-planar Rendering by Yubraj Gupta *****************/
/**********************************************************************/

function tri_planar_rendering(tri_imageData){

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

container.style.display = 'flex';
openglRenderWindow.setContainer(container);
renderWindow.addView(openglRenderWindow);
const { width, height } = container.getBoundingClientRect();
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

    const dataRange = tri_imageData[y].getPointData().getScalars().getRange();
    const extent = tri_imageData[y].getExtent();

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

const center = getCenterOfScene(renderer);
const iStyle = vtkInteractorStyleManipulator.newInstance();

iStyle.setCenterOfRotation(center);

// Mouse interactor
const uiComponents = {};
const selectMap = {
  leftButton: { button: 1 },
  rightButton: { button: 3 },
  scrollMiddleButton: { scrollEnabled: true, dragEnabled: true },
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
  uiComponents[name] = { elt, manipName: elt.value, };
});


renderWindow.getInteractor().setInteractorStyle(iStyle);

const axes = vtkAnnotatedCubeActor.newInstance();

axes.setDefaultStyle({text: '+X', fontStyle: 'bold', fontFamily: 'Arial', fontColor: 'white',
faceColor: createRGBStringFromRGBValues(viewColors[0]), edgeThickness: 0.1, edgeColor: 'white',
resolution: 1600,
});

axes.setXMinusFaceProperty({text: '-X', faceColor: createRGBStringFromRGBValues(viewColors[0]),
});

axes.setYPlusFaceProperty({text: '+Y', faceColor: createRGBStringFromRGBValues(viewColors[1]),
});

axes.setYMinusFaceProperty({text: '-Y', faceColor: createRGBStringFromRGBValues(viewColors[1]),
});

axes.setZPlusFaceProperty({text: '+Z', faceColor: createRGBStringFromRGBValues(viewColors[2]),
});

axes.setZMinusFaceProperty({text: '-Z', faceColor: createRGBStringFromRGBValues(viewColors[2]),
});

// create orientation widget
orientationWidget = vtkOrientationMarkerWidget.newInstance({actor: axes, interactor: interactor});
setTimeout(() => {
    orientationWidget.setEnabled(true);
    orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
    orientationWidget.setViewportSize(0.15);
    orientationWidget.setMinPixelSize(20);
    orientationWidget.setMaxPixelSize(80);
}, 1);

window.onresize = () => {orientationWidget.updateViewport();}

renderer.resetCamera();
renderWindow.render()

reassignManipulators();
imageK.setVisibility(edge_K);
edge_K = !(edge_K);
imageJ.setVisibility(edge_J);
edge_J = !(edge_J);
imageI.setVisibility(edge_I);
edge_I = !(edge_I);

// Change canvas background color
var Reset_Background = document.getElementById('Reset_Background');
count = 0;
Reset_Background.onclick = function() {
    count +=1;
    console.log(count)
    if (count == 1) {
        renderer.setBackground(0.5, 0.5, 0.5); // GRAY
        renderWindow.render();
    } else if (count == 2) {
        renderer.setBackground(1, 1, 1); // WHITE
        renderWindow.render();
    } else if (count == 3){
        renderer.setBackground(0, 0, 0);  // BLACK
        renderWindow.render();
        console.log(count)
        count = 0;
    }
};

// DISPLAY RESET
const Reset_canvas = document.getElementById('Reset_canvas');
Reset_canvas.addEventListener('click', () => {
  renderer.resetCamera();
  renderWindow.render();
});


}

/**********************************************************************/
/***************** Multi-Planar Reconstruction Rendering **************/
/**********************************************************************/

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

// CALL THE VTK FUNCTIONS
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
const vtkImageReslice = vtk.Imaging.Core.vtkImageReslice;
const vtkMapper = vtk.Rendering.Core.vtkMapper;
const vtkOutlineFilter = vtk.Filters.General.vtkOutlineFilter;
const vtkOrientationMarkerWidget = vtk.Interaction.Widgets.vtkOrientationMarkerWidget;
const vtkResliceCursorWidget = vtk.Widgets.Widgets3D.vtkResliceCursorWidget;
const vtkWidgetManager = vtk.Widgets.Core.vtkWidgetManager;
const vtkSphereSource = vtk.Filters.Sources.vtkSphereSource;
const controlPanel = vtkResliceCursorWidget.controlPanel;

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

const showDebugActors = true;

// ----------------------------------------------------------------------------
// Define html structure
// ----------------------------------------------------------------------------

const container = document.getElementById('viewContainer');
container.style.display = 'wrap';
container.style = 'margin-left : 527px';

function createRGBStringFromRGBValues(rgb) {
  if (rgb.length !== 3) {
    return 'rgb(0, 0, 0)';
  }
  return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(rgb[2] * 255).toString()})`;
}

const initialPlanesState = { ...widgetState.getPlanes() };

let view3D = null;

// create axes, orientation widget
for (let i = 0; i < 4; i++) {
  const element = document.createElement('div');
  element.setAttribute('class', 'view');
  element.style.width = '50%';
  element.style.height = '400px';
  element.style.display = 'inline-flex';
  element.style.position = 'none';
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
    obj.widgetInstance.setScaleInPixels(true);
    obj.widgetInstance.setRotationHandlePosition(0.75);
    obj.widgetManager.enablePicking();
    // Use to update all renderers buffer when actors are moved
    obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);
  } else {
    obj.interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
  }

  obj.reslice = vtkImageReslice.newInstance();
  obj.reslice.setTransformInputSampling(false);
  obj.reslice.setAutoCropOutput(true);
  obj.reslice.setOutputDimensionality(2);
  obj.resliceMapper = vtkImageMapper.newInstance();
  obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
  obj.resliceActor = vtkImageSlice.newInstance();
  obj.resliceActor.setMapper(obj.resliceMapper);
  obj.sphereActors = [];
  obj.sphereSources = [];

  // Create sphere for each 2D views which will be displayed in 3D
  // Define origin, point1 and point2 of the plane used to reslice the volume
  for (let j = 0; j < 3; j++) {
    const sphere = vtkSphereSource.newInstance();
    sphere.setRadius(10);
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

  // create axes
  const axes = vtkAnnotatedCubeActor.newInstance();
  axes.setDefaultStyle({
    text: '+X',fontStyle: 'bold',fontFamily: 'Arial',fontColor: 'white',
    faceColor: createRGBStringFromRGBValues(viewColors[0]),edgeThickness: 0.1,edgeColor: 'white',resolution: 400,
  });

  axes.setXMinusFaceProperty({text: '-X',faceColor: createRGBStringFromRGBValues(viewColors[0]),
  });

  axes.setYPlusFaceProperty({text: '+Y',faceColor: createRGBStringFromRGBValues(viewColors[1]),
  });

  axes.setYMinusFaceProperty({text: '-Y',faceColor: createRGBStringFromRGBValues(viewColors[1]),
  });

  axes.setZPlusFaceProperty({text: '+Z',faceColor: createRGBStringFromRGBValues(viewColors[2]),
  });

  axes.setZMinusFaceProperty({text: '-Z',faceColor: createRGBStringFromRGBValues(viewColors[2]),
  });

  // create orientation widget
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,interactor: obj.renderWindow.getInteractor(),
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT);
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(20);
  orientationWidget.setMaxPixelSize(80);
}

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

        widget.setImage(mpr_imageData[m]);

        // Create image outline in 3D view
        const outline = vtkOutlineFilter.newInstance();
        outline.setInputData(mpr_imageData[m]);

        const outlineMapper = vtkMapper.newInstance();
        outlineMapper.setInputData(outline.getOutputData());
        const outlineActor = vtkActor.newInstance();
        outlineActor.setMapper(outlineMapper);
        view3D.renderer.addActor(outlineActor);

        viewAttributes.forEach((obj, i) => {
            obj.reslice.setInputData(mpr_imageData[m]);
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
                      const activeViewType = widget.getWidgetState().getActiveViewType();
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

/**********************************************************************/
/**********************************************************************/
/************* Input callback functions *******************************/
/**********************************************************************/
/**********************************************************************/


/**********************************************************************/
/***** Callback function for Volume rendering *************************/
/**********************************************************************/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

function vol_processFile(vol_arrFileList, vol_color_val) {

  var vol_img  = []
  const vol_files = vol_arrFileList

vol_prom = []

for ( l = 0 ; l < vol_files.length; l++) {

    if (l  == 0) {
        if (vol_arr[0][0].webkitRelativePath.slice(-4) == '.dcm') {
             vol_prom[l] = itk.readImageDICOMFileSeries(vol_files[l]).then(function ({ image: itkImage }) {
             vol_imageData = convertItkToVtkImage(itkImage)
             vol_img.push(vol_imageData)
             })

        } else if (vol_files[l].length !== 1) {
             vol_prom[l] = itk.readImageFileSeries(vol_files[l], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
             vol_imageData = convertItkToVtkImage(itkImage)
             vol_img.push(vol_imageData)
             })

        } else if (vol_files[l].length === 1) {
            vol_prom[l] = itk.readImageFile(null, vol_files[l][0]).then(function ({ image: itkImage, webWorker }) {
            webWorker.terminate()
            vol_imageData = convertItkToVtkImage(itkImage)
            vol_img.push(vol_imageData)
            })
        }
    }
    else {
        if (vol_arr[0][0].webkitRelativePath.slice(-4) == '.dcm') {
            vol_prom[l] = itk.readImageDICOMFileSeries(vol_files[l]).then(function ({ image: itkImage }) {
            vol_imageData = convertItkToVtkImage(itkImage)
            vol_img.push(vol_imageData)
            })

        } else if (vol_files[l].length !== 1) {
            vol_prom[l] = itk.readImageFileSeries(vol_files[l], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
            vol_imageData = convertItkToVtkImage(itkImage)
            vol_img.push(vol_imageData)
            })

        } else if (vol_files[l].length === 1) {
            vol_prom[l] = itk.readImageFile(null, vol_files[l][0]).then(function ({ image: itkImage, webWorker }) {
            webWorker.terminate()
            vol_imageData = convertItkToVtkImage(itkImage)
            vol_img.push(vol_imageData)
            })
        }
    }
}

Promise.all(vol_prom).then((values) => {

    $( "#v1" ).prop( "disabled", true )
    $( "#r1" ).prop( "disabled", true )
    $( "#v2" ).prop( "disabled", true )
    $( "#v3" ).prop( "disabled", true )
    $( "#r2" ).prop( "disabled", true )
    $( "#btn1" ).prop( "disabled", true )
    $( "#btn2" ).prop( "disabled", true )
    // $( "#f" ).prop( "disabled", true )
    $( ".colors_channels" ).prop( "disabled", false )

     volume_rendering(vol_img, vol_color_val) // Calls Volume rendering script

      $("#loading").hide();

    console.log(vol_img.length +"  -  "+ vol_files.length)

}).catch(
console.log("Please check the input files again"));

}

/**********************************************************************/
/***** Callback function for Surface rendering ************************/
/**********************************************************************/

function sur_processFile(sur_arrFileList, sur_color_val) {
  var sur_img  = []
  const sur_files = sur_arrFileList

sur_prom = []

for ( w = 0 ; w < sur_files.length; w++) {
    if (w  == 0) {
        if (sur_arr[0][0].webkitRelativePath.slice(-4) == '.dcm') {
            sur_prom[w] = itk.readImageDICOMFileSeries(sur_files[w]).then(function ({ image: itkImage }) {
            sur_imageData = convertItkToVtkImage(itkImage)
            sur_img.push(sur_imageData)
            })

        } else if (sur_files[w].length !== 1) {
            sur_prom[w] = itk.readImageFileSeries(sur_files[w], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
            sur_imageData = convertItkToVtkImage(itkImage)
            sur_img.push(sur_imageData)
            })

        } else if (sur_files[w].length === 1) {
            sur_prom[w] = itk.readImageFile(null, sur_files[w][0]).then(function ({ image: itkImage, webWorker }) {
            webWorker.terminate()
            sur_imageData = convertItkToVtkImage(itkImage)
            sur_img.push(sur_imageData)
            })
        }
    }
    else {
        if (sur_arr[0][0].webkitRelativePath.slice(-4) == '.dcm')  {
            sur_prom[w] = itk.readImageDICOMFileSeries(sur_files[w]).then(function ({ image: itkImage }) {
            sur_imageData = convertItkToVtkImage(itkImage)
            sur_img.push(sur_imageData)
            })

        } else if (sur_files[w].length !== 1) {
            sur_prom[w] = itk.readImageFileSeries(sur_files[w], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
            sur_imageData = convertItkToVtkImage(itkImage)
            sur_img.push(sur_imageData)
            })

        } else if (sur_files[w].length === 1) {
            sur_prom[w] = itk.readImageFile(null, sur_files[w][0]).then(function ({ image: itkImage, webWorker }) {
            webWorker.terminate()
            sur_imageData = convertItkToVtkImage(itkImage)
            sur_img.push(sur_imageData)
            })
        }
    }
}

Promise.all(sur_prom).then((values) => {

    $( "#v1" ).prop( "disabled", true )
    $( "#r2" ).prop( "disabled", true )
    $( "#v2" ).prop( "disabled", true )
    $( "#v3" ).prop( "disabled", true )
    $( "#r1" ).prop( "disabled", true )
    $( "#btn1" ).prop( "disabled", true )
    $( "#btn2" ).prop( "disabled", true )
     // $( "#f" ).prop( "disabled", true )
     $( ".col_sur" ).prop( "disabled", false )

     surface_rendering(sur_img, sur_color_val) // Calls surface rendering script

     $("#loading").hide();

     console.log(sur_img.length +"  -  "+ sur_files.length)
;
}).catch(
console.log("Please check the input files again"));

}

/**********************************************************************/
/***** Callback function for Tri-Planar rendering *********************/
/**********************************************************************/

function tri_processFile(tri_arrFileList) {
  var tri_img  = []
  const tri_files = tri_arrFileList

tri_prom = []

for ( v = 0 ; v < tri_files.length; v++) {
    if (v  == 0) {
        if (tri_arr[0][0].webkitRelativePath.slice(-4) == '.dcm') {
             tri_prom[v] = itk.readImageDICOMFileSeries(tri_files[v]).then(function ({ image: itkImage }) {
             tri_imageData = convertItkToVtkImage(itkImage)
             tri_img.push(tri_imageData)
             })

        } else if (tri_files[v].length !== 1) {
             tri_prom[v] = itk.readImageFileSeries(tri_files[v], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
             tri_imageData = convertItkToVtkImage(itkImage)
             tri_img.push(tri_imageData)
             })

        } else if (tri_files[v].length === 1) {
             tri_prom[v] = itk.readImageFile(null, tri_files[v][0]).then(function ({ image: itkImage, webWorker }) {
             webWorker.terminate()
             tri_imageData = convertItkToVtkImage(itkImage)
             tri_img.push(tri_imageData)
             })
        }
    }
    else {
        if (tri_arr[0][0].webkitRelativePath.slice(-4) == '.dcm') {
            tri_prom[v] = itk.readImageDICOMFileSeries(tri_files[v]).then(function ({ image: itkImage }) {
            tri_imageData = convertItkToVtkImage(itkImage)
            tri_img.push(tri_imageData)
            })
        } else if (tri_files[v].length !== 1) {
            tri_prom[v] = itk.readImageFileSeries(tri_files[v], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
            tri_imageData = convertItkToVtkImage(itkImage)
            tri_img.push(tri_imageData)
            })
        } else if (tri_files[v].length === 1) {
             tri_prom[v] = itk.readImageFile(null, tri_files[v][0]).then(function ({ image: itkImage, webWorker }) {
             webWorker.terminate()
             tri_imageData = convertItkToVtkImage(itkImage)
             tri_img.push(tri_imageData)
             })
        }
    }
}

Promise.all(tri_prom).then((values) => {

    $( "#v1" ).prop( "disabled", true )
    $( "#v3" ).prop( "disabled", true )
    $( "#btn1" ).prop( "disabled", true )
    $( "#btn2" ).prop( "disabled", true )
     // $( "#f" ).prop( "disabled", true )
     $( "#v2" ).prop( "disabled", true )

     $("#loading").show();
     tri_planar_rendering(tri_img) // Calls Tri-Planar rendering script

     $("#loading").hide();
     console.log(tri_img.length +"  -  "+ tri_files.length)

}).catch(
console.log("Please check the input files again"));

}

/**********************************************************************/
/***** Callback function for Tri-Planar rendering *********************/
/**********************************************************************/

function mpr_processFile(mpr_arrFileList) {
  var mpr_img  = []
  const mpr_files = mpr_arrFileList

mpr_prom = []

for ( u = 0 ; u < mpr_files.length; u++) {
   if (u  == 0) {
      if (mpr_arr[0][0].webkitRelativePath.slice(-4) == '.dcm') {
           mpr_prom[u] = itk.readImageDICOMFileSeries(mpr_files[u]).then(function ({ image: itkImage }) {
           mpr_imageData = convertItkToVtkImage(itkImage)
           mpr_img.push(mpr_imageData)
           })

      } else if (mpr_files[u].length !== 1) {
           mpr_prom[u] = itk.readImageFileSeries(mpr_files[u], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
           mpr_imageData = convertItkToVtkImage(itkImage)
           mpr_img.push(mpr_imageData)
           })

      } else if (mpr_files[u].length === 1) {
           mpr_prom[u] = itk.readImageFile(null, mpr_files[u][0]).then(function ({ image: itkImage, webWorker }) {
           webWorker.terminate()
           mpr_imageData = convertItkToVtkImage(itkImage)
           mpr_img.push(mpr_imageData)
           })
      }
   }
   else {
      if (mpr_arr[0][0].webkitRelativePath.slice(-4) == '.dcm') {
           mpr_prom[u] = itk.readImageDICOMFileSeries(mpr_files[u]).then(function ({ image: itkImage }) {
           mpr_imageData = convertItkToVtkImage(itkImage)
           mpr_img.push(mpr_imageData)
           })

      } else if (mpr_files[u].length !== 1) {
           mpr_prom[u] = itk.readImageFileSeries(mpr_files[u], zSpacing=1.0, zOrigin=0.0).then(function ({ image: itkImage }) {
           mpr_imageData = convertItkToVtkImage(itkImage)
           mpr_img.push(mpr_imageData)
           })

      } else if (mpr_files[u].length === 1) {
           mpr_prom[u] = itk.readImageFile(null, mpr_files[u][0]).then(function ({ image: itkImage, webWorker }) {
           webWorker.terminate()
           mpr_imageData = convertItkToVtkImage(itkImage)
           mpr_img.push(mpr_imageData)
           })
      }
    }
}

Promise.all(mpr_prom).then((values) => {

    $( "#v1" ).prop( "disabled", true )
    $( "#v2" ).prop( "disabled", true )
    $( "#btn1" ).prop( "disabled", true )
    $( "#btn2" ).prop( "disabled", true )
    // $( "#f" ).prop( "disabled", true )
    $( "#Reset_canvas" ).prop( "disabled", true )

    $("#loading").show();
    mpr_rendering(mpr_img) // Calls Multi-Planar Reconstruction rendering script
    $("#loading").hide();

    console.log(mpr_img.length +"  -  "+ mpr_files.length)
    $( "#v3" ).prop( "disabled", true )

}).catch(
console.log("Please check the input files again"));

}

/**********************************************************************/
/*************************** The End **********************************/
/**********************************************************************/
