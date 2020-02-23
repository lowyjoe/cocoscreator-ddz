
// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

cc.Class({
    extends: cc.Component,

    properties: {
        roomNumber:cc.Label,
        leftName:cc.Label,
        rightName:cc.Label,
        playerName:cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //获取房间信息
        this.roomNumber.string = "房间号："+Global.roomNum ;
        let self = this;
        self.playerName.string = Global.playerName;
        if (Global.roomWaitType == 'join') {
            window.Network.socket.emit("getRoomData",Global.roomNum);
        }
        
        window.Network.socket.on("getRoomDataBack" ,function(data){
            console.log(data);
            var playerIndex = 0;
            for (let index = 0; index < data.length; index++) {
                const player = data[index];
                if (player == Global.playerName) {
                    playerIndex = index;
                    Global.roomIndex = playerIndex;
                }
            }
            if(data.length==2){
                if (playerIndex == 0) {
                    self.leftName.string = "等待加入";
                    self.rightName.string = data[1]?data[1]:"等待加入";
                } else if(playerIndex == 1) {
                    self.leftName.string = data[0]?data[0]:"等待加入";
                    self.rightName.string = "等待加入";
                }
            }else{
                if (playerIndex == 0) {
                    self.leftName.string = data[2]?data[2]:"等待加入";
                    self.rightName.string = data[1]?data[1]:"等待加入";
                } else if(playerIndex == 1) {
                    self.leftName.string = data[0]?data[0]:"等待加入";
                    self.rightName.string = data[2]?data[2]:"等待加入";
                }else{
                    self.leftName.string = data[1]?data[1]:"等待加入";
                    self.rightName.string = data[0]?data[0]:"等待加入";
                }
            }
            

            if (data.length == 3) {
                cc.director.loadScene('game'); 
            }
        });

    },

    start () {

    },

    // update (dt) {},
});
