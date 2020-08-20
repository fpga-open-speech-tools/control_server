const merge = require('deepmerge');
const util = require('../utilities.js');
const Register = require('./Register.js');
const ModelDataClient = require('./ModelDataClient.js');
const overlayManager = require('./FpgaOverlayManager')
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const CONFIG_DIR = path.join(__dirname, '../../config/')

var modelConfig = {};// util.loadJsonFile(CONFIG_FILE);
var modelDataClient;
// const modelDataClient = new ModelDataClient(false, this.setData);
// modelDataClient.callbacks.incomingDataListener = setData;


setDownloadRequest = function (CommandObject) {
    try {
            
            // previous overlay needs to be removed before loading in a new one
            if (previousProjectName) {
                overlayManager.remove(previousProjectName);
            }

            var downloadPromise = overlayManager.downloadAndInstall(CommandObject.downloadurl, configPath);

            return downloadPromise.then((result) => {
                //let status = "success"
                //res.statusCode = 200;
                if (!fs.existsSync(CONFIG_DIR + 'ui.json') ) {
                    if(fs.existsSync(CONFIG_DIR + 'model.json')){
                        setModelConfig(util.convertModelJsonToUIJson(CONFIG_DIR + 'model.json'))
                    }
                    else {
                        return null;
                        status = "no configuration";
                        res.statusCode = 400
                    }
                }
                console.log(status)
                // TODO: the FpgaOverlayManager should know about the previous project it loaded, so it can
                //       handle removing overlays by itself. 
                // previousProjectName = CommandObject.projectname.replace('-', '_');
                
                return modelConfig;
            }, (result) => {
                console.log("failure");
                // TODO: send back something else one failure
                return null;
            });
        }
        catch (error) {
            console.error(error);
            return new Promise((resolve, reject) => resolve(null));
        }
};

getConfiguration = function () {
    return modelConfig;
}

setConfiguration = function (newConfig) {
    // console.log(config);
    modelConfig.views=newConfig.views;
    modelConfig.containers=newConfig.containers;
    modelConfig.name = newConfig.name;
    //modelConfig = merge(modelConfig, newConfig, {arrayMerge : combineMerge});
    // console.log(config);
    util.saveJsonFile(CONFIG_FILE, modelConfig);
}

getData = function () {
    return modelConfig.data;
}

setModelConfig = function (newModelConfig){
    if(!newModelConfig.views){
        newModelConfig.views = []
    }
    if(!newModelConfig.containers){
        newModelConfig.containers = []
    }
    modelConfig = newModelConfig
}

setData = function(dataPackets) {
    return new Promise((resolve, reject) => {

        let errors = [];

        for (const dataPacket of dataPackets) {
            try {
                // console.log(dataPacket);
                // console.log(dataPacket.index);
                let datum = modelConfig.data[dataPacket.index];
                // console.log(datum);
                // console.log(modelConfig);

                if (datum.type === "register") {
                    const dataWritePromise = Register.write(
                        datum.device, 
                        datum.name,
                        dataPacket.value
                    );

                    dataWritePromise.then((fulfilledResult) => {
                        // console.log(`successfully wrote ${dataPacket.value} to ${datum.device} ${datum.name}`);
                        // data write was successful, so update the shadow in modelConfig
                        datum.value = dataPacket.value;

                    }, (rejectedResult) => {
                        // TODO: error handling
                        console.error(rejectedResult);
                    });
                }
                else {
                    errors.append(`data type ${datum.type} is not supported`);
                }

            } 
            catch (error) {
                console.error(error);
            }
        }

        if (errors && errors.length) {
            reject({errors});
        }
        else {
            // TODO: what to return on success?
            resolve({})
        }
    });

};

// merge arrays together instead of concatenating them when merging objects
// taken from the deepmerge documentation
const combineMerge = (target, source, options) => {
    const destination = target.slice()
 
    source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
            destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
        } else if (options.isMergeableObject(item)) {
            destination[index] = merge(target[index], item, options)
        } else if (target.indexOf(item) === -1) {
            destination.push(item)
        }
    })
    return destination
}

connectSignalR = (address) => {
    let connectionStatus = {rtcEnabled: false};
    const port = 5000;

    if (modelDataClient) {
        console.log(modelDataClient.connected)
        if(modelDataClient.connected){
            console.log('already connected');
            connectionStatus.rtcEnabled = true;
            return;
        }
        console.log('model data client not connected')
        modelDataClient = new ModelDataClient(`http://${address}:${port}/model-data`, 
            false, setData);
        modelDataClient.startSession();
        connectionStatus.rtcEnabled = true;
        return;
    }
    console.log('model data client undefined')
    modelDataClient = new ModelDataClient(`http://${address}:${port}/model-data`, 
        false, setData);
    modelDataClient.startSession();
    return;
}


exports.newModel = setDownloadRequest;
exports.setConfig = setData;
exports.getConfig = getData;
exports.subscribeConfig = connectSignalR;
//, getConfiguration, setConfiguration, getData, setData, setModelConfig;