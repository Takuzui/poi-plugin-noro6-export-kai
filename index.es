import React, { Component } from 'react'
import { Button, Radio, RadioGroup } from "@blueprintjs/core"
import { connect } from 'react-redux'
import { shell } from 'electron'
export const windowMode = false;
const { BrowserWindow } = require('electron').remote;
const { i18n } = window;

const NORO6_MODE_ICONS = {
    fleet: 'M7,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V4A2,2 0 0,1 7,2M7,4V8H17V4H7M7,10V12H9V10H7M11,10V12H13V10H11M15,10V12H17V10H15M7,14V16H9V14H7M11,14V16H13V14H11M15,14V16H17V14H15M7,18V20H9V18H7M11,18V20H13V18H11M15,18V20H17V18H15Z',
    stock: 'M4 7C4 4.79 7.58 3 12 3S20 4.79 20 7 16.42 11 12 11 4 9.21 4 7M12.08 18L12 18C7.58 18 4 16.21 4 14V17C4 19.21 7.58 21 12 21C12.1 21 12.2 21 12.29 21C12.11 20.36 12 19.69 12 19C12 18.66 12.03 18.33 12.08 18M20 12.08C20 12.05 20 12.03 20 12V9C20 11.21 16.42 13 12 13S4 11.21 4 9V12C4 14.21 7.58 16 12 16C12.23 16 12.46 16 12.69 16C13.82 13.63 16.22 12 19 12C19.34 12 19.67 12.03 20 12.08M23.8 20.4C23.9 20.4 23.9 20.5 23.8 20.6L22.8 22.3C22.7 22.4 22.6 22.4 22.5 22.4L21.3 22C21 22.2 20.8 22.3 20.5 22.5L20.3 23.8C20.3 23.9 20.2 24 20.1 24H18.1C18 24 17.9 23.9 17.8 23.8L17.6 22.5C17.3 22.4 17 22.2 16.8 22L15.6 22.5C15.5 22.5 15.4 22.5 15.3 22.4L14.3 20.7C14.2 20.6 14.3 20.5 14.4 20.4L15.5 19.6V18.6L14.4 17.8C14.3 17.7 14.3 17.6 14.3 17.5L15.3 15.8C15.4 15.7 15.5 15.7 15.6 15.7L16.8 16.2C17.1 16 17.3 15.9 17.6 15.7L17.8 14.4C17.8 14.3 17.9 14.2 18.1 14.2H20.1C20.2 14.2 20.3 14.3 20.3 14.4L20.5 15.7C20.8 15.8 21.1 16 21.4 16.2L22.6 15.7C22.7 15.7 22.9 15.7 22.9 15.8L23.9 17.5C24 17.6 23.9 17.7 23.8 17.8L22.7 18.6V19.6L23.8 20.4M20.5 19C20.5 18.2 19.8 17.5 19 17.5S17.5 18.2 17.5 19 18.2 20.5 19 20.5 20.5 19.8 20.5 19Z'
};

const Noro6ModeIcon = ({ mode }) => (
    <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true">
        <path
            d={NORO6_MODE_ICONS[mode === 'fleet' ? 'fleet' : 'stock']}
            fill={mode === 'fleet' ? '#66bb6a' : '#42a5f5'}
        />
    </svg>
);

const parseShip = (ship) => {
    let tempObj =
    {
        "api_id": ship.api_id,
        "api_ship_id": ship.api_ship_id,
        "api_lv": ship.api_lv,
        "api_kyouka": ship.api_kyouka,
        "api_exp": ship.api_exp,
        "api_slot_ex": ship.api_slot_ex
    }
    
    // 活动贴条只在存在时添加
    if (ship.api_sally_area !== undefined) {
        tempObj.api_sally_area = ship.api_sally_area;
    }
    
    // 添加缎带信息 (api_sp_effect_items)
    if (ship.api_sp_effect_items && ship.api_sp_effect_items.length) {
        tempObj.api_sp_effect_items = ship.api_sp_effect_items;
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
    airbases: state.info.airbase,
    combinedFlag: state.sortie && state.sortie.combinedFlag
}))(class View extends Component {

    state = { 
        result: "",
        shipExportType: "locked",
        equipExportType: "all",
        airbaseAreaId: "event",  // "event" (活动海域, >=30), "central" (中部海域, 6), "southwest" (南西海域, 7)
        copyMode: "fleet"
    };

    //导出舰队和陆航信息
    exportFleet = () => {
        const fleets = this.props.fleets;
        const ships = this.props.ships;
        const equips = this.props.equips;
        const airbases = this.props.airbases;
        const combinedFlag = [1, 2, 3].includes(Number(this.props.combinedFlag))
            ? Number(this.props.combinedFlag)
            : 0;
        let result = `{"version": 4,"hqlv":${this.props.hqlv},`;

        //遍历母港中的舰队并且生成json
        for (let i = 0; i < fleets.length; i++) {
            const fleet = fleets[i];
            result += `"f${i + 1}":{`;
            if (i === 0 && combinedFlag > 0) {
                result += `"t":${combinedFlag},`;
            }
            //遍历舰队中的船只
            for (let j = 0; j < fleet.api_ship.length; j++) {
                if (ships[fleet.api_ship[j]]) {
                    const ship = ships[fleet.api_ship[j]];
                    result += `"s${j + 1}":{"id":${ship.api_ship_id},"lv":${ship.api_lv},"luck":${ship.api_lucky[0]}`;
                    
                    if (ship.api_sally_area !== undefined) {
                        result += `,"area":${ship.api_sally_area}`;
                    }

                    // 添加缎带信息 (spi 格式用于 DeckBuilder)
                    if (ship.api_sp_effect_items && ship.api_sp_effect_items.length) {
                        result += `,"spi":${JSON.stringify(ship.api_sp_effect_items.map(item => ({
                            kind: item.api_kind,
                            fp: item.api_kind === 2 ? 2 : 0,
                            tp: 1,
                            ar: 1,
                            ev: item.api_kind === 2 ? 2 : 0
                        })))}`;
                    }
                    
                    result += `,"items":{`;
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
            // 根据选择的海域筛选陆航
            const areaId = this.state.airbaseAreaId;
            if (areaId === "event" && airbase.api_area_id < 30) continue;
            if (areaId === "central" && airbase.api_area_id !== 6) continue;
            if (areaId === "southwest" && airbase.api_area_id !== 7) continue;
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
        this.setState({ result: strResult })

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
                // 修复：兼容数字和字符串类型的锁定状态
                return ship.api_locked == "1" || ship.api_locked == 1
            }).forEach(ship => {
                result.push(parseShip(ship))
            })

        let strResult = JSON.stringify(result)
        this.setState({ result: strResult })

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
        this.setState({ result: strResult });

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
                // 修复：只有当api_locked明确为1或"1"时才认为是锁定状态
                if (equip.api_locked != "1" && equip.api_locked != 1) {
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
        const fleetData = this.exportFleet();
        
        // 根据当前选择导出舰娘数据
        let ships;
        if (this.state.shipExportType === 'all') {
            ships = Object.keys(this.props.ships).map(key => parseShip(this.props.ships[key]));
        } else {
            ships = Object.values(this.props.ships)
                .filter(ship => ship.api_locked == "1" || ship.api_locked == 1)
                .map(ship => parseShip(ship));
        }
        
        // 根据当前选择导出装备数据
        let items;
        if (this.state.equipExportType === 'all') {
            items = [];
            Object.keys(this.props.equips).forEach((key) => {
                const equip = this.props.equips[key];
                if (equip) {
                    items.push({ "id": equip.api_slotitem_id, "lv": equip.api_level || 0 });
                }
            });
        } else {
            items = [];
            const len = Object.keys(this.props.equips).pop();
            for (let j = 0; j < len; j++) {
                const equip = this.props.equips[j];
                if (equip && (equip.api_locked == "1" || equip.api_locked == 1)) {
                    items.push({ "id": equip.api_slotitem_id, "lv": equip.api_level || 0 });
                }
            }
        }

        // 构建完整的导入数据对象
        const predeck = JSON.parse(fleetData);
        const importData = { predeck, ships, items };
        const url = `https://noro6.github.io/kc-web#import:${JSON.stringify(importData)}`;
        
        // 从本地存储读取上次的窗口大小
        const savedBounds = localStorage.getItem('noro6-window-bounds');
        let windowOptions = {
            width: 1400,
            height: 900,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        };
        
        // 如果有保存的窗口大小，使用保存的值
        if (savedBounds) {
            try {
                const bounds = JSON.parse(savedBounds);
                windowOptions.width = bounds.width;
                windowOptions.height = bounds.height;
                if (bounds.x !== undefined && bounds.y !== undefined) {
                    windowOptions.x = bounds.x;
                    windowOptions.y = bounds.y;
                }
            } catch (e) {
                console.error('Failed to parse saved window bounds:', e);
            }
        }
        
        // 在poi内部窗口打开
        const newWindow = new BrowserWindow(windowOptions);
        
        newWindow.setMenuBarVisibility(false);
        
        newWindow.once('ready-to-show', () => {
            newWindow.show();
        });
        
        // 保存窗口大小和位置
        const saveBounds = () => {
            const bounds = newWindow.getBounds();
            localStorage.setItem('noro6-window-bounds', JSON.stringify(bounds));
        };
        
        // 监听窗口大小变化
        newWindow.on('resize', saveBounds);
        newWindow.on('move', saveBounds);
        
        // 窗口关闭时保存
        newWindow.on('close', saveBounds);
        
        newWindow.loadURL(url);
    }



    getSelectedShips = () => {
        return Object.values(this.props.ships)
            .filter(ship => ship)
            .filter(ship => (
                this.state.shipExportType === 'all'
                || ship.api_locked == 1
            ));
    }



    getSelectedEquips = () => {
        return Object.values(this.props.equips)
            .filter(equip => equip)
            .filter(equip => (
                this.state.equipExportType === 'all'
                || equip.api_locked == 1
            ));
    }



    copySelectedData = () => {
        if (this.state.copyMode === 'fleet') {
            copyToClipboard(this.exportFleet());
            return;
        }

        if (this.state.copyMode === 'ship') {
            const response = {
                api_result: 1,
                api_result_msg: '成功',
                api_data: {
                    api_ship: this.getSelectedShips()
                }
            };
            copyToClipboard(`svdata=${JSON.stringify(response)}`);
            return;
        }

        const response = {
            api_result: 1,
            api_result_msg: '成功',
            api_data: this.getSelectedEquips()
        };
        copyToClipboard(`svdata=${JSON.stringify(response)}`);
    }



    toggleCopyMode = () => {
        const nextCopyMode = {
            fleet: 'ship',
            ship: 'equip',
            equip: 'fleet'
        };
        this.setState(state => ({
            copyMode: nextCopyMode[state.copyMode]
        }));
    }



    // 从外部浏览器打开noro6，只导出舰队配置和陆航
    openNoro6External = () => {
        const fleetData = this.exportFleet();
        const url = `https://noro6.github.io/kc-web/?predeck=${fleetData}`;
        shell.openExternal(url);
    }



    // 从外部浏览器打开jervis，只导出舰队配置和陆航
    openJervisExternal = () => {
        const fleetData = this.exportFleet();
        const url = `https://fleethub.madonoharu.workers.dev/?predeck=${fleetData}`;
        shell.openExternal(url);
    }



    render() {
        const result = this.state.result;
        const __ = i18n['poi-plugin-noro6-export-kai'].__.bind(i18n['poi-plugin-noro6-export-kai']);
        const copyButtonLabels = {
            fleet: __('Copy Fleet Composition Data'),
            ship: __('Copy Ship Data'),
            equip: __('Copy Equipment Data')
        };
        const nextCopyModeTitles = {
            fleet: __('Switch to Ship Data'),
            ship: __('Switch to Equipment Data'),
            equip: __('Switch to Fleet Composition Data')
        };
        const copyButtonLabel = copyButtonLabels[this.state.copyMode];
        const copyModeTitle = nextCopyModeTitles[this.state.copyMode];
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

                <div style={{ marginBottom: '20px', display: 'flex' }}>
                    <Button 
                        large 
                        style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        onClick={this.openNoro6External}
                    >
                        {__('Open noro6')}
                    </Button>
                    <Button 
                        large 
                        style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        onClick={this.openJervisExternal}
                    >
                        {__('Open Jervis')}
                    </Button>
                </div>

                <div style={{ marginBottom: '20px', display: 'flex' }}>
                    <Button
                        large
                        style={{
                            flex: 1,
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0
                        }}
                        onClick={this.copySelectedData}
                    >
                        {copyButtonLabel}
                    </Button>
                    <Button
                        large
                        title={copyModeTitle}
                        aria-label={copyModeTitle}
                        style={{
                            flex: '0 0 48px',
                            width: '48px',
                            padding: 0,
                            marginLeft: '-1px',
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0
                        }}
                        onClick={this.toggleCopyMode}
                    >
                        <Noro6ModeIcon mode={this.state.copyMode} />
                    </Button>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>{__('Airbase Area')}</div>
                        <RadioGroup
                            inline
                            onChange={(e) => this.setState({ airbaseAreaId: e.target.value })}
                            selectedValue={this.state.airbaseAreaId}
                        >
                            <Radio label={__('Event Airbase')} value="event" />
                            <Radio label={__('Central Airbase')} value="central" />
                            <Radio label={__('Southwest Airbase')} value="southwest" />
                        </RadioGroup>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 500 }}>{__('Ship Data')}</div>
                        <RadioGroup
                            inline
                            onChange={(e) => this.setState({ shipExportType: e.target.value })}
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
                            onChange={(e) => this.setState({ equipExportType: e.target.value })}
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
