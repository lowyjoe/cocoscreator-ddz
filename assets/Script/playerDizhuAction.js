

cc.Class({
    extends: cc.Component,

    properties: {
        buqiangLabel: cc.Label, 
        qiangLabel: cc.Label, 
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },
    //设置叫和抢
    setFirst( isFirst){
        if (isFirst) {
            this.buqiangLabel.string = "不叫"
            this.qiangLabel.string = "叫地主"
        }else{
            this.buqiangLabel.string = "不抢"
            this.qiangLabel.string = "抢地主"
        }
    },
    buqiang(){
        let mes = {playerIndex:Global.roomIndex,roomNum: Global.roomNum,qiangdizhu:false};
        window.Network.socket.emit('qiangdizhu',  window.Network.stringifyJson(mes));
        this.node.active = false;
    },
    qiang(){
        let mes = {playerIndex:Global.roomIndex,roomNum: Global.roomNum,qiangdizhu:true};
        window.Network.socket.emit('qiangdizhu',   window.Network.stringifyJson(mes));
        this.node.active = false;
    }
    // update (dt) {},
});
