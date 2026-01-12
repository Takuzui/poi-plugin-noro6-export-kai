import React, { Component } from 'react'
import { Button, Radio, RadioGroup } from "@blueprintjs/core"
import { connect } from 'react-redux'
import { shell } from 'electron'
export const windowMode = false;
const { BrowserWindow } = require('electron').remote;
import './index.css';


const parseShip = (ship) => {
    let tempObj =
    {
        "id": ship.api_ship_id,
        "lv": ship.api_lv,
        "st": ship.api_kyouka,
        "exp": ship.api_exp,
        "ex": ship.api_slot_ex
    }

    if (ship.api_sally_area) {
        tempObj.area = ship.api_sally_area
    }

    return tempObj;
}



const parseEquip = (equip) => {
    let tempObj =
    {
        "id": equip.api_slotitem_id,
        "lv": equip.api_level
    }

    if(equip.api_level == undefined) {
        tempObj.lv = 0;
    }

    return tempObj;
}



const copyToClipboard = (result) => {
    const content = document.createElement('input'),
    text = result;
    document.body.appendChild(content);
    content.value = text;
    content.select();
    document.execCommand('copy');
    document.body.removeChild(content);
}



export const reactClass = connect(state => ({
    ships: state.info.ships,
    equips: state.info.equips
}))(class View extends Component {

    state = { 
        result: "",
        shipExportType: "all",
        equipExportType: "all"
    };

    //舰娘数据导出(包含未锁定)
    //另外3个函数代码大致相同
    exportShipsAll = () => {
        //读取数据
        const ships = this.props.ships;
        let result = []
        Object.keys(ships).forEach((key) => {
            const ship = ships[key]
            result.push(parseShip(ship))
        })
        let strResult = JSON.stringify(result)
        this.setState({ strResult })

        //复制到剪贴板
        copyToClipboard(strResult)

        return result;
    }



    //舰娘数据导出(不包含未锁定)
    exportShipsLocked = () => {
        const ships = this.props.ships;
        let result = []
        Object.values(ships)
            .filter(ship => {
                return ship.api_locked == "1"
            }).forEach(ship => {
                result.push(parseShip(ship))
            })

        let strResult = JSON.stringify(result)
        this.setState({ strResult })

        //复制到剪贴板
        copyToClipboard(strResult)

        return result;
    }



    //装备数据导出(包含未锁定)
    exportEquipsAll = () => {
        const equips = this.props.equips;
        let result = [];

        Object.keys(equips).forEach((key) => {
            const equip = equips[key];
            if (equip) {
                if (equip.api_level === undefined) {
                    result.push({ "id": equip.api_slotitem_id, "lv": 0 });
                } else {
                    result.push({ "id": equip.api_slotitem_id, "lv": equip.api_level });
                }
            }
        });

        let strResult = JSON.stringify(result);
        this.setState({ strResult });

        // 复制到剪贴板
        copyToClipboard(strResult);

        return result;
    }



    //装备数据导出(不包含未锁定)
    exportEquipsLocked = () => {
        const equips = this.props.equips;
        let result = `[`;
        const len = Object.keys(equips).pop();

        for (let j = 0; j < len; j++) {
            if (equips[j]) {
                const equip = equips[j];
                if (equip.api_locked == "0") {
                    continue;
                }
                if(equip.api_level == undefined) {
                    result += `{"id":${equip.api_slotitem_id},"lv":0},`
                }
                else {
                    result += `{"id":${equip.api_slotitem_id},"lv":${equip.api_level}},`
                }
            }
        }
        if (result.charAt(result.length - 1) == ',') {
            result = result.slice(0, result.length - 1)
        }
        result += `]`

        this.setState({ result })

        copyToClipboard(result)

        return result;
    }



    openNewPage = () => {
        const ships = this.exportShipsAll();
        const equips = this.exportEquipsAll();

        const encodedShips = JSON.stringify(ships);
        const encodedEquips = JSON.stringify(equips);

        const url = `https://noro6.github.io/kc-web#import:{"predeck":{},"ships":${encodedShips},"items":${encodedEquips}}`;

        const newWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });
        
        newWindow.setMenuBarVisibility(false);
        
        newWindow.once('ready-to-show', () => {
            newWindow.show();
        });
        
        newWindow.loadURL(url);
    }



    copyUrl = () => {
        const ships = this.exportShipsAll();
        const equips = this.exportEquipsAll();

        const encodedShips = JSON.stringify(ships);
        const encodedEquips = JSON.stringify(equips);

        const url = `https://noro6.github.io/kc-web#import:{"predeck":{},"ships":${encodedShips},"items":${encodedEquips}}`;

        copyToClipboard(url);
    }



    render() {
        const result = this.state.result;
        return (
            <div>
                <h2 className="mergin">制空权模拟器 v2</h2>

                <br />
                <br />
                
                <div className="buttonGroup">
                    <div className="groups">
                        <h4>POI页面</h4>
                        <Button className="openNewPageButton" onClick={this.openNewPage}>
                            打开制空权计算机
                        </Button>
                    </div>

                    <div className="groups">
                        <h4>可导出至外部浏览器</h4>
                        <Button className="openNewPageButton" onClick={this.copyUrl}>
                            复制导出链接
                        </Button>
                    </div>
                </div>

                <br />
                <br />

                <div>
                    <h4 className="mergin">单独数据选用</h4>
                    
                    <div style={{ marginLeft: '10px', marginBottom: '15px' }}>
                        <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>舰娘数据</label>
                        <RadioGroup
                            onChange={(e) => {
                                this.setState({ shipExportType: e.target.value });
                                if (e.target.value === 'all') {
                                    this.exportShipsAll();
                                } else {
                                    this.exportShipsLocked();
                                }
                            }}
                            selectedValue={this.state.shipExportType}
                        >
                            <Radio label="包含未锁定" value="all" />
                            <Radio label="仅已锁定" value="locked" />
                        </RadioGroup>
                    </div>
                    
                    <div style={{ marginLeft: '10px' }}>
                        <label style={{ fontWeight: 500, marginBottom: '8px', display: 'block' }}>装备数据</label>
                        <RadioGroup
                            onChange={(e) => {
                                this.setState({ equipExportType: e.target.value });
                                if (e.target.value === 'all') {
                                    this.exportEquipsAll();
                                } else {
                                    this.exportEquipsLocked();
                                }
                            }}
                            selectedValue={this.state.equipExportType}
                        >
                            <Radio label="包含未锁定" value="all" />
                            <Radio label="仅已锁定" value="locked" />
                        </RadioGroup>
                    </div>
                </div>
            </div>
        )
    }
})