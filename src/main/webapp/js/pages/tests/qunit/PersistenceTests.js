
define(function (require) {
    var QUnit = require("qunitjs");
    require('../../../components/ComponentFactory')(GEPPETTO);
    global.GEPPETTO_CONFIGURATION = require('../../../../GeppettoConfiguration.json');
    /**
     * Calls "start()" from QUnit to start qunit tests, closes socket and clears
     * handlers. Method is called from each test.
     */
    function resetConnection() {
        //close socket
        GEPPETTO.MessageSocket.close();
        //clear message handlers, all tests within module should have performed by time method it's called
        GEPPETTO.MessageSocket.clearHandlers();
        //connect to socket again for next test
        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + GEPPETTO_CONFIGURATION.contextPath + '/GeppettoServlet');
    }

    var run = function () {

        QUnit.module("Project 1 - SingleComponentHH");
        QUnit.test("Test switching active experiment", function ( assert ) {

            var done = assert.async();

            var handler = {
                switchExperiment: false,
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project ID checked");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.MODEL_LOADED:
                            GEPPETTO.Manager.loadModel(JSON.parse(parsedServerMessage.data));

                            // test that geppetto model high level is as expected
                            assert.ok(window.Model != undefined, "Model is not undefined");
                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
                                window.Model.getVariables()[0].getId() == 'hhcell' && window.Model.getVariables()[1].getId() == 'time',  "2 Variables as expected");
                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
                            // test that instance tree high level is as expected
                            assert.ok(window.Instances != undefined && window.Instances.length == 1 && window.Instances[0].getId() == 'hhcell', "1 top level instance as expected");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.Manager.loadExperiment(payload);
                            //if project 1 doesn't have more than one experiment, it isn't loaded from persistence
                            if (window.Project.getExperiments().length > 1) {
                                if (!this.switchExperiment) {
                                    assert.equal(window.Project.getActiveExperiment().getId(), 1, "Active experiment id of loaded project checked");

                                    window.Project.getExperiments()[1].setActive();
                                    this.switchExperiment = true;
                                } else {
                                    assert.equal(window.Project.getActiveExperiment().getId(), 2, "New Active experiment id of loaded project checked");

                                    done();
                                    resetConnection();
                                }
                            } else {
                                assert.ok(false, "Failed to load project from persistence");

                                done();
                                resetConnection();
                            }

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                         case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);

	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1", "1");
        });

        QUnit.test("Test uploading simulation results to DropBox (requires linking)", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project ID checked");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.MODEL_LOADED:
                            GEPPETTO.Manager.loadModel(JSON.parse(parsedServerMessage.data));

                            // test that geppetto model high level is as expected
                            assert.ok(window.Model != undefined, "Model is not undefined");
                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
                                      window.Model.getVariables()[0].getId() == 'hhcell' && window.Model.getVariables()[1].getId() == 'time',  "2 Variables as expected");
                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
                            // test that instance tree high level is as expected
                            assert.ok(window.Instances != undefined && window.Instances.length == 1 && window.Instances[0].getId() == 'hhcell', "1 top level instance as expected");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.Manager.loadExperiment(payload);

                            assert.equal(window.Project.getActiveExperiment().getId(), 2, "Active experiment id of loaded project checked");


                            var login = GEPPETTO.UserController.isLoggedIn();
                        	var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
                        	var projectPersisted = window.Project.persisted;
                        	if(writePermission && projectPersisted && login){
                                window.Project.getActiveExperiment().uploadResults("hhcell", "GEPPETTO_RECORDING");
                        	}else{
                        		assert.ok(false, "Results Not Downloaded Okay due to Permission restrictions!");

                                done();
                                resetConnection();
                            }

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.RESULTS_UPLOADED:
                            assert.ok("Results Uploaded", "Results Uploaded Okay!");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1", "2");
        });

        QUnit.test("Test uploading simulation model to DropBox (requires linking)", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project ID checked");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.MODEL_LOADED:
                            GEPPETTO.Manager.loadModel(JSON.parse(parsedServerMessage.data));

                            // test that geppetto model high level is as expected
                            assert.ok(window.Model != undefined, "Model is not undefined");
                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
                                window.Model.getVariables()[0].getId() == 'hhcell' && window.Model.getVariables()[1].getId() == 'time',  "2 Variables as expected");
                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
                            // test that instance tree high level is as expected
                            assert.ok(window.Instances != undefined && window.Instances.length == 1 && window.Instances[0].getId() == 'hhcell', "1 top level instance as expected");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.Manager.loadExperiment(payload);

                            assert.equal(window.Project.getActiveExperiment().getId(), 2, "Active experiment id of loaded project checked");

                            var login = GEPPETTO.UserController.isLoggedIn();
                        	var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
                        	var projectPersisted = window.Project.persisted;
                        	if(writePermission && projectPersisted && login){
                                window.Project.getActiveExperiment().uploadModel('hhcell');
                        	}else{
                        		assert.ok(false, "Results Not Downloaded Okay due to Permission restrictions!");

                                done();
                                resetConnection();
                            }

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.MODEL_UPLOADED:
                            assert.ok(true, "Model Uploaded Okay!");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1", "2");
        });

        QUnit.test("Test downloading simulation results", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project ID checked");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.MODEL_LOADED:
                            GEPPETTO.Manager.loadModel(JSON.parse(parsedServerMessage.data));

                            // test that geppetto model high level is as expected
                            assert.ok(window.Model != undefined, "Model is not undefined");
                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
                                window.Model.getVariables()[0].getId() == 'hhcell' && window.Model.getVariables()[1].getId() == 'time',  "2 Variables as expected");
                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
                            // test that instance tree high level is as expected
                            assert.ok(window.Instances != undefined && window.Instances.length == 1 && window.Instances[0].getId() == 'hhcell', "1 top level instance as expected");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.Manager.loadExperiment(payload);

                            assert.equal(window.Project.getActiveExperiment().getId(), 2, "Active experiment id of loaded project checked");

                            var login = GEPPETTO.UserController.isLoggedIn();
                        	var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
                        	var projectPersisted = window.Project.persisted;
                        	if(writePermission && projectPersisted && login){
                        		window.Project.getActiveExperiment().downloadResults('hhcell', 'GEPPETTO_RECORDING');
                        	}else{
                        		assert.ok(false, "Results Not Downloaded Okay due to Permission restrictions!");

                                done();
                                resetConnection();
                            }
                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.ERROR_DOWNLOADING_RESULTS:
                            assert.ok("Model Not Downloaded", "Results Not Downloaded Okay!");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.ERROR:
                            assert.ok("Model Not Downloaded", "Results Not Downloaded Okay!");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.DOWNLOAD_RESULTS:
                            assert.ok("Model Downloaded", "Results Downloaded Okay!");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1", "2");
        });

        QUnit.test("Test downloading simulation model", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project ID checked");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.MODEL_LOADED:
                            GEPPETTO.Manager.loadModel(JSON.parse(parsedServerMessage.data));

                            // test that geppetto model high level is as expected
                            assert.ok(window.Model != undefined, "Model is not undefined");
                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
                                window.Model.getVariables()[0].getId() == 'hhcell' && window.Model.getVariables()[1].getId() == 'time',  "2 Variables as expected");
                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
                            // test that instance tree high level is as expected
                            assert.ok(window.Instances != undefined && window.Instances.length == 1 && window.Instances[0].getId() == 'hhcell', "1 top level instance as expected");

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.Manager.loadExperiment(payload);

                            assert.equal(window.Project.getActiveExperiment().getId(), 1, "Active experiment id of loaded project checked");

                            var login = GEPPETTO.UserController.isLoggedIn();
                        	var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
                        	var projectPersisted = window.Project.persisted;
                        	if(writePermission && projectPersisted && login){
                        		window.Project.downloadModel('hhcell');
                        	}else{
                        		assert.ok(false, "Results Not Downloaded Okay due to Permission restrictions!");

                                done();
                                resetConnection();
                            }

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.DOWNLOAD_MODEL:
                            assert.ok("Model Downloaded", "Model Downloaded Okay!");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, "Failed to load project from persistence");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, "Failed to load project from persistence");

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1", "1");
        });


        QUnit.test("Test Persist Project (requires aws.credentials)", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));
                            window.Project.persist();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_PERSISTED:
                            assert.ok(true, "Project persisted");
                            GEPPETTO.Manager.persistProject(JSON.parse(parsedServerMessage.data));

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            Project.loadFromURL("https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/SingleComponentHH/GEPPETTO.json");
        });

        QUnit.test("Test Save Project Properties", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");
                            var properties = {"name": "New Project Name"};
                            window.Project.saveProjectProperties(properties);

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_PROPS_SAVED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            assert.ok(true, "Project saved");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1");
        });

        QUnit.test("Test Save Experiment Properties", function ( assert ) {

            var done = assert.async();

            var handler = {
            	newExperiment : null,
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");
                            window.Project.newExperiment();
                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_PROPS_SAVED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            assert.ok(true, "Experiment saved");
                            this.newExperiment.deleteExperiment();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            this.newExperiment = GEPPETTO.Manager.createExperiment(payload);

                            // increase length
                            newLength++;

                            assert.equal(window.Project.getExperiments().length, newLength, "New experiment created checked");
                            var properties = {"name": "New Name for Experiment",
                            				  "conversionServiceId" : "testService",
                            				  "simulatorId" : "testSimulator",
                            				  "length" : "2",
                            				  "timeStep" : "3",
                            				  "aspectInstancePath" : "hhcell(net1)"};
                            this.newExperiment.saveExperimentProperties(properties);
                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_DELETED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.deleteExperiment(payload);

                            // reduce length
                            newLength--;

                            assert.equal(window.Project.getExperiments().length, newLength, "Experiment deleted succesfully");
                            done();
                            resetConnection();
                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1");
        });

        QUnit.test("Test Delete experiment", function ( assert ) {

            var done = assert.async();

            var handler = {
            	newExperiment : null,
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");

                            var length = window.Project.getExperiments().length - 1;
                            window.Project.newExperiment();
                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            this.newExperiment = GEPPETTO.Manager.createExperiment(payload);

                            // increase length
                            newLength++;

                            assert.equal(window.Project.getExperiments().length, newLength, "New experiment created checked");
                            this.newExperiment.deleteExperiment();
                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_DELETED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.deleteExperiment(payload);

                            // reduce length
                            newLength--;

                            assert.equal(window.Project.getExperiments().length, newLength, "New experiment created checked");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).msg;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1");
        });

        QUnit.test("Test Create New experiment", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");
                            window.Project.newExperiment();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.createExperiment(payload);

                            // increase length
                            newLength++;

                            assert.equal(window.Project.getExperiments().length, newLength, "New experiment created checked");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).msg;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1");
        });

        QUnit.test("Test Clone experiment", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");

                            window.Project.getExperiments()[0].clone();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.createExperiment(payload);

                            // increase length
                            newLength++;

                            assert.equal(window.Project.getExperiments().length, newLength, "New experiment created checked");
                            var oldSimLength =
                            	Project.getExperiments()[0].simulatorConfigurations["hhcell"].length;
                            var cloneSimLength =
                            	Project.getExperiments()[newLength-1].simulatorConfigurations["hhcell"].length;
                            var oldSimStep =
                            	Project.getExperiments()[0].simulatorConfigurations["hhcell"].timeStep;
                            var cloneSimStep =
                            	Project.getExperiments()[newLength-1].simulatorConfigurations["hhcell"].timeStep;
                            var oldSimId =
                            	Project.getExperiments()[0].simulatorConfigurations["hhcell"].simulatorId;
                            var cloneSimId =
                            	Project.getExperiments()[newLength-1].simulatorConfigurations["hhcell"].simulatorId;

                            assert.equal(oldSimLength, cloneSimLength, "Clone Experiment - Simulator Configuration duration checked");
                            assert.equal(oldSimStep, cloneSimStep, "Clone Experiment - Simulator Configuration time step checked");
                            assert.equal(oldSimId, cloneSimId, "Clone Experiment - Simulator Configuration service id checked");

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).msg;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1");
        });

        QUnit.test("Test Create and Delete multiple experiments", function ( assert ) {

        	var done = assert.async();

            var handler = {
            	runTimes : 0,
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");
                            window.Project.newExperiment();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.createExperiment(payload);

                            // increase length
                            newLength++;

                            assert.equal(window.Project.getExperiments().length, newLength, "New experiment created checked");

                            var length = window.Project.getExperiments().length - 1;
                            window.Project.getExperiments()[length].deleteExperiment();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_DELETED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.deleteExperiment(payload);

                            // reduce length
                            newLength--;

                            assert.equal(window.Project.getExperiments().length, newLength, "Experiment deleted succesfully");

                            this.runTimes++;
                            if(this.runTimes>5){
                            	done();
                            	resetConnection();
                            }else{
                            	window.Project.newExperiment();
                            }

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).msg;

                            // make it fail
                            assert.ok(true, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1");
        });

        QUnit.test("Test Cloning and Delete multiple experiments", function ( assert ) {

        	var done = assert.async();

            var handler = {
            	runTimes : 0,
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.Manager.loadProject(JSON.parse(parsedServerMessage.data));

                            assert.equal(window.Project.getId(), 1, "Project loaded ID checked");
                            window.Project.getExperiments()[0].clone();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_CREATED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.createExperiment(payload);

                            // increase length
                            newLength++;

                            assert.equal(window.Project.getExperiments().length, newLength, "New experiment created checked");

                            var length = window.Project.getExperiments().length - 1;
                            window.Project.getExperiments()[length].deleteExperiment();

                            break;
                        case GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_DELETED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var newLength = window.Project.getExperiments().length;

                            GEPPETTO.Manager.deleteExperiment(payload);

                            // reduce length
                            newLength--;

                            assert.equal(window.Project.getExperiments().length, newLength, "Experiment deleted succesfully");

                            done();
                        	resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).msg;

                            // make it fail
                            assert.ok(false, message);

                            done();
                            resetConnection();

                            break;
                        case "error_loading_project":
                            var payload = JSON.parse(parsedServerMessage.data);
	                        assert.ok(false, payload.message);

	                        done();
	                        resetConnection();
                        	break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("1");
        });
    };
    return {run: run};
});
