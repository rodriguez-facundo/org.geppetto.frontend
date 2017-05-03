define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/interface/3dCanvas/Canvas.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react');
    var isWebglEnabled = require('detector-webgl');
    var ThreeDEngine = require('./ThreeDEngine');

    var CameraControls = require('../cameraControls/CameraControls');

    var canvasComponent = React.createClass({
        engine: null,
        container: null,
        backgroundColor: 0x101010,


        display: function (instances) {
            this.engine.buildScene(instances);
            return this;
        },

        displayAllInstances: function () {
            var that = this;
            GEPPETTO.on(GEPPETTO.Events.Instances_created,function(instances){
    			that.engine.updateSceneWithNewInstances(instances);
    		});
            GEPPETTO.on(GEPPETTO.Events.Instance_deleted,function(instance){
    			that.engine.removeFromScene();
    		});
            return this;
        },

        /**
         * Selects an instance
         *
         * @param {String} instancePath - Path of instance to select
         * @param {String} geometryIdentifier - Identifier of the geometry that was clicked
         */
        selectInstance: function (instancePath, geometryIdentifier) {
            this.engine.selectInstance(instancePath, geometryIdentifier);
            return this;
        },

        /**
         * Deselects an instance
         *
         * @param {String} instancePath - Path of instance to select
         * @param {String} geometryIdentifier - Identifier of the geometry that was clicked
         */
        deselectInstance: function (instancePath) {
            this.engine.deselectInstance(instancePath);
            return this;
        },

        assignRandomColor: function (instance) {
            this.engine.assignRandomColor(instance);
            return this;
        },

        /**
         * Zoom to the passed instances
         * @param instances
         */
        zoomTo: function (instances) {
            this.engine.zoomTo(instances);
            return this;
        },

        /**
         * Sets whether to use wireframe or not to visualize any instance. 
         */
        setWireframe: function (wireframe) {
            this.engine.setWireframe(wireframe);
            return this;
        },

        /**
         * Show an instance
         *
         * @param {String}
         *            instancePath - Instance path of the instance to make visible
         */
        showInstance: function (instancePath) {
            this.engine.showInstance(instancePath);
            return this;
        },

        /**
         * Hide an instance
         *
         * @param {String}
         *            instancePath - Path of the instance to hide
         */
        hideInstance: function (instancePath) {
            this.engine.hideInstance(instancePath);
            return this;
        },

        /**
         * Change the color of a given instance
         *
         * @param {String}
         *            instancePath - Instance path of the instance to change color
         * @param {String}
         *            color - The color to set
         */
        setColor: function (instancePath, color) {
            this.engine.setColor(instancePath, color);
            return this;
        },

        /**
         * Change the default opacity for a given instance
         *
         * @param {String}
         *            instancePath - Instance path of the instance to set the opacity of
         * @param {String}
         *            opacity - The value of the opacity between 0 and 1
         */
        setOpacity: function (instancePath, opacity) {
            this.engine.setOpacity(instancePath, opacity);
            return this;
        },

        /**
         * Set the threshold (number of 3D primitives on the scene) above which we switch the visualization to lines
         * @param threshold
         */
        setLinesThreshold: function (threshold) {
            this.engine.setLinesThreshold(ithreshold);
            return this;
        },

        /**
         * Change the type of geometry used to visualize a given instance
         *
         * @param {String}
         *            instance - The instance to change the geometry type for
         * @param {String}
         *            type - The geometry type, see GEPPETTO.Resources.GeometryTypes
         * @param {String}
         *            thickness - Optional: the thickness to be used if the geometry is "lines"
         */
        setGeometryType: function (instance, type, thickness) {
            this.engine.setGeometryType(instance, type, thickness);
            return this;
        },


        /**
         * Activates a visual group
         */
        showVisualGroups: function (visualGroup, mode, instances) {
            this.engine.showVisualGroups(visualGroup, mode, instances);
            return this;
        },

        /**
         * Light up the passed instance
         *
         * @param {Instance}
         *            instance - the instance to be lit
         * @param {Instance}
         *            colorfn - a function to map the intensity to a color
         * @param {Float}
         *            intensity - the lighting intensity from 0 (no illumination) to 1 (full illumination)
         */
        lightUpEntity: function (instance, colorfn, intensity) {
            this.engine.lightUpEntity(instance, colorfn, intensity);
            return this;
        },

        /**
         * @param x
         * @param y
         */
        incrementCameraPan: function (x, y) {
            this.engine.incrementCameraPan(x, y);
            return this;
        },

        /**
         * @param x
         * @param y
         * @param z
         */
        incrementCameraRotate: function (x, y, z) {
            this.engine.incrementCameraRotate(x, y, z);
            return this;
        },

        /**
         * @param z
         */
        incrementCameraZoom: function (z) {
            this.engine.incrementCameraZoom(z);
            return this;
        },

        /**
         * @param x
         * @param y
         * @param z
         */
        setCameraPosition: function (x, y, z) {
            this.engine.setCameraPosition(x, y, z);
            return this;
        },

        /**
         * @param rx
         * @param ry
         * @param rz
         * @param radius
         */
        setCameraRotation: function (rx, ry, rz, radius) {
            this.engine.setCameraRotation(rx, ry, rz, radius);
            return this;
        },

        /**
         * Rotate the camera around the selection
         *
         */
        autoRotate: function () {
            this.engine.autoRotate();
            return this;
        },

        /**
         * Reset camera
         */
        resetCamera: function () {
            this.engine.resetCamera();
            return this;
        },


        /**
         * Set container dimensions depending on parent dialog
         */
        setContainerDimensions: function () {
            var containerSelector = $(this.container);
            var height = containerSelector.parent().height();
            var width = containerSelector.parent().width();
            containerSelector.height(height);
            containerSelector.width(width);
            return [width, height];
        },


        shouldComponentUpdate() {
            return false;
        },

        componentDidMount: function () {
            if (!isWebglEnabled) {
                Detector.addGetWebGLMessage();
            } else {
                this.container = $("#" + this.props.id + "_component").get(0);
                this.setContainerDimensions();
                this.engine = new ThreeDEngine(this.container, this.props.id);
                GEPPETTO.SceneController.add3DCanvas(this);
                var that = this;
                $("#" + this.props.id).on("dialogresizestop resizeEnd", function (event, ui) {
                    var [width, height] = that.setContainerDimensions()
                    that.engine.setSize(width, height);
                });

            }
        },

        render: function () {
            return (
                <div key={this.props.id + "_component"} id={this.props.id + "_component"} className="canvas">
                    <CameraControls viewer={this.props.id} />
                </div>
            )
        }
    });
    return canvasComponent;
});