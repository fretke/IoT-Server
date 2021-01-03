const socket = require("socket.io");

const inEvents = {
    updateDevice: "updateDevice",
    updateServo: "updateServo",
    addServo: "addServo",
    deleteServo: "deleteServo",
    liveControl: "liveControl",
    executeSequence: "executeSequence",
    taskCompleted: "taskCompleted",
    servoPos: "servoPos",
    addDevice: "addDevice",
    deleteDevice: "deleteDevice",
    heartBeat: "heartBeat",
    controllerPong: "controllerPong",
}

const outEvents = {
    onDeviceToggle: "onDeviceToggle",
    onServoUpdate: "onServoUpdate",
    onUpdateStarted: "onUpdateStarted",
    onUpdateFinished: "onUpdateFinished",
    onSequenceOver: "onSequenceOver",
    playSequence: "playSequence",
    onServoAdd: "onServoAdd",
    onServoDelete: "onServoDelete",
    onDeviceAdd: "onDeviceAdd",
    onDeviceDelete: "onDeviceDelete",
    controllerPing: "controllerPing",
    onControllerPong: "onControllerPong",
}

class WsManager {

    constructor(server) {
        this._socket = socket(server);
        this._property = "property";
    }

    initService(){
        this._socket.sockets.on("connection", this.setConnection.bind(this))
    }

    getSocket(){
        return this._socket;
    }

    setConnection(socket){
        socket.on("room", (room) => {
            socket.room = room;
            socket.join(room);
        });

        socket.on(inEvents.updateDevice, (data) => {
            socket.to(socket.room).emit(outEvents.onDeviceToggle, { name: data.name, status: data.status });
            this._socket.to(socket.room).emit(outEvents.onUpdateStarted);
        });

        socket.on(inEvents.updateServo, (data) => {
            this._socket.to(socket.room).emit(outEvents.onServoUpdate, data);
            this._socket.to(socket.room).emit(outEvents.onUpdateStarted);
        });

        socket.on(inEvents.liveControl, (data) => {
            socket.to(socket.room).emit(inEvents.liveControl, data);
        })

        socket.on(inEvents.taskCompleted, (data) => {
            socket.to(socket.room).emit(outEvents.onUpdateFinished, { status: data });
        });

        socket.on(inEvents.executeSequence, (data) => {
            socket
                .to(socket.room)
                .emit(outEvents.playSequence, { numberOfMoves: data.length, data });
            this._socket.to(socket.room).emit(outEvents.onUpdateStarted);
        });

        socket.on(inEvents.servoPos, (res) => {
            const formated = res.data.split(".").map((data, index) => {
                const arr = data.split(",");
                return {
                    name: arr[0],
                    pos: arr[2],
                    speed: arr[1],
                };
            });
            socket
                .to(socket.room)
                .emit(outEvents.onSequenceOver, formated);
        });

        socket.on(inEvents.addServo, (data) => {
            socket.to(socket.room).emit(outEvents.onServoAdd, data);
        });
        socket.on(inEvents.deleteServo, (data) => {
            socket.to(socket.room).emit(outEvents.onServoDelete, data);
        });
        socket.on(inEvents.addDevice, (data) => {
            socket.to(socket.room).emit(outEvents.onDeviceAdd, data);
        });
        socket.on(inEvents.deleteDevice, (data) => {
            socket.to(socket.room).emit(outEvents.onDeviceDelete, data);
        });
        socket.on(inEvents.heartBeat, (data) => {
            socket.to(socket.room).emit(outEvents.controllerPing, data)
        });
        socket.on(inEvents.controllerPong, (data) => {
            socket.to(socket.room).emit(outEvents.onControllerPong, +data.data)
        })
    }
}

module.exports = WsManager;
