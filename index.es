import React, { Component } from 'react'
import { Button, Radio, RadioGroup } from "@blueprintjs/core"
import { connect } from 'react-redux'
import { shell } from 'electron'
export const windowMode = false;
const { BrowserWindow } = require('electron').remote;
const { i18n } = window;


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
    hqlv: state.info.basic.api_level,
    fleets: state.info.fleets,
    ships: state.info.ships,
    equips: state.info.equips,
    airbases: state.info.airbase
}))(class View extends Component {

    state = { 
        result: "",
        shipExportType: "locked",
        equipExportType: "locked",
        activityAirbaseOnly: true
    };

    //导出舰队和陆航信息
    exportFleet = () => {
        const fleets = this.props.fleets;
        const ships = this.props.ships;
        const equips = this.props.equips;
        const airbases = this.props.airbases;
        let result = `{"version": 4,"hqlv":${this.props.hqlv},`;

        //遍历母港中的舰队并且生成json
        for (let i = 0; i < fleets.length; i++) {
            const fleet = fleets[i];
            result += `"f${i + 1}":{`;
            //遍历舰队中的船只
            for (let j = 0; j < fleet.api_ship.length; j++) {
                if (ships[fleet.api_ship[j]]) {
                    const ship = ships[fleet.api_ship[j]];
                    result += `"s${j + 1}":{"id":${ship.api_ship_id},"lv":${ship.api_lv},"luck":${ship.api_lucky[0]},"items":{`;
                    //遍历船只的装备
                    for (let k = 0; k < ship.api_slot.length; k++) {
                        const slot = ship.api_slot[k];
                        if (equips[slot]) {
                            const equip = equips[slot];
                            result += `"i${k + 1}":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                            if (equip.api_alv) {
                                result += `,"mas":${equip.api_alv}`
                            }
                            result += `},`
                        }
                    }
                    //查看是否存在额外装备（孔）
                    if (equips[ship.api_slot_ex]) {
                        const equip = equips[ship.api_slot_ex]
                        result += `"ix":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                        if (equip.api_alv) {
                            result += `,"mas":${equip.api_alv}`
                        }
                        result += `}`
                    }
                    //去除最后的逗号并且补上items的后括号
                    if (result.charAt(result.length - 1) == ',') {
                        result = result.slice(0, result.length - 1) + `}`
                    } else {
                        result += `}`
                    }
                    //补上ships的后括号
                    result += `},`
                }
            }
            //去除最后的逗号并且补上fleets的后括号
            if (result.charAt(result.length - 1) == ',') {
                result = result.slice(0, result.length - 1) + `},`
            } else {
                result += `},`
            }
        }
        //遍历陆航中的航空中队
        let airbase_cnt = 0;
        for (let i = 0; i < airbases.length; i++) {
            const airbase = airbases[i];
            if (this.state.activityAirbaseOnly && airbase.api_area_id < 30) continue;
            airbase_cnt += 1;
            result += `"a${airbase_cnt}":{"items": {`;
            //遍历航空中队中的飞机
            for (let j = 0; j < airbase.api_plane_info.length; j++) {
                const plane = airbase.api_plane_info[j];
                if (equips[plane.api_slotid]) {
                    const equip = equips[plane.api_slotid]
                    result += `"i${j + 1}":{"id":${equip.api_slotitem_id},"rf":${equip.api_level}`
                    if (equip.api_alv) {
                        result += `,"mas":${equip.api_alv}`
                    }
                    result += `},`
                }
            }
            //去除最后的逗号并且补上items的后括号
            if (result.charAt(result.length - 1) == ',') {
                result = result.slice(0, result.length - 1) + `},`
            } else {
                result += `},`
            }
            //加上航空中队的行动状态
            result += `"mode":${airbase.api_action_kind}},`
        }
        //去除最后的逗号并且补上json字符串的后括号
        if (result.charAt(result.length - 1) == ',') {
            result = result.slice(0, result.length - 1) + `}`
        } else {
            result += `}`
        }
        return result;
    }

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
        const result = this.exportFleet();
        const url = `https://noro6.github.io/kc-web/?predeck=${result}`;
        
        // 在poi内部窗口打开
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
        const result = this.exportFleet();
        const url = `https://noro6.github.io/kc-web/?predeck=${result}`;
        copyToClipboard(url);
    }



    render() {
        const result = this.state.result;
        const __ = i18n['poi-plugin-noro6-export-kai'].__.bind(i18n['poi-plugin-noro6-export-kai']);
        return (
            <div style={{ padding: '10px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Button 
                        intent="primary" 
                        large 
                        fill
                        onClick={this.openNewPage}
                    >
                        {__('Open Air Control Simulator')}
                    </Button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Button 
                        large 
                        fill
                        onClick={this.copyUrl}
                    >
                        {__('Copy Export Link')}
                    </Button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label>
                        <input 
                            type="checkbox" 
                            checked={this.state.activityAirbaseOnly} 
                            onChange={(e) => this.setState({ activityAirbaseOnly: e.target.checked })}
                        />
                        {' '}{__('Export Event Airbase Only')}
                    </label>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>{__('Ship Data')}</div>
                        <RadioGroup
                            inline
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
                            <Radio label={__('Locked Only')} value="locked" />
                            <Radio label={__('Include Unlocked')} value="all" />
                        </RadioGroup>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>{__('Equipment Data')}</div>
                        <RadioGroup
                            inline
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
                            <Radio label={__('Locked Only')} value="locked" />
                            <Radio label={__('Include Unlocked')} value="all" />
                        </RadioGroup>
                    </div>
                </div>
            </div>
        )
    }
})