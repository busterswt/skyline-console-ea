// Copyright 2021 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { ServerStore } from 'stores/nova/instance';
import { InstanceVolumeStore } from 'stores/nova/instance-volume';
import { PortStore } from 'stores/neutron/port';
import { ServerGroupStore } from 'stores/nova/server-group';
import Base from 'containers/BaseDetail';
import ItemActionButtons from 'components/Tables/Base/ItemActionButtons';
import { Link } from 'react-router-dom';
// render topo content
import { Col, Row, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import Status from 'components/Status';
import volumeIcon from 'src/asset/image/volume.svg';
import instanceIcon from 'src/asset/image/instance.svg';
import interfaceIcon from 'src/asset/image/interface.svg';
import classnames from 'classnames';
import ImageType from 'components/ImageType';
import { instanceStatus, isIronicInstance } from 'resources/instance';
import { generateId } from 'utils/index';
import { getSinceTime } from 'utils/time';
import AttachVolume from 'pages/compute/containers/Instance/actions/AttachVolume';
import styles from './index.less';

@inject('rootStore')
@observer
export default class BaseDetail extends Base {
  componentDidMount() {
    this.fetchVolumes();
    this.fetchInterfaces();
    if (this.detailData.server_groups[0]) {
      this.fetchSeverGroup();
    }
  }

  init() {
    this.store = new ServerStore();
    this.interfaceStore = new PortStore();
    this.volumeStore = new InstanceVolumeStore();
    this.serverGroupStore = new ServerGroupStore();
  }

  get leftCards() {
    const cards = [
      this.networkCard,
      this.flavorCard,
      this.imageCard,
      this.securityGroupCard,
    ];
    if (!isIronicInstance(this.detailData)) {
      cards.push(this.serverGroupCard);
    }
    return cards;
  }

  get rightCards() {
    return [this.topoCard];
  }

  get networkCard() {
    const addresses = toJS(this.detailData.addresses) || [];
    const networks = [];
    Object.keys(addresses).forEach((netName) => {
      const values = addresses[netName];
      const fixedIps = values.filter((it) => it['OS-EXT-IPS:type'] === 'fixed');
      const fips = values.filter((it) => it['OS-EXT-IPS:type'] === 'floating');
      fixedIps.forEach((fixedIp) => {
        const fip = fips.find(
          (it) =>
            it['OS-EXT-IPS-MAC:mac_addr'] === fixedIp['OS-EXT-IPS-MAC:mac_addr']
        );
        networks.push({
          netName,
          fixedIp,
          fip,
        });
      });
    });
    const content = networks.map((item, index) => {
      const { netName, fixedIp, fip } = item;
      return (
        <div key={`${fixedIp['OS-EXT-IPS-MAC:mac_addr']}-${index}`}>
          {netName} | {fixedIp.addr} {fip && <span>| {fip.addr}</span>}
        </div>
      );
    });
    const options = [
      {
        label: t('Network'),
        content,
      },
    ];
    return {
      title: t('Network Info'),
      options,
    };
  }

  get flavorCard() {
    const privateFlavors = toJS(this.detailData.flavor) || [];
    const options = [
      {
        label: t('Flavor Name'),
        content: privateFlavors.original_name,
      },
      {
        label: t('RAM'),
        content: `${privateFlavors.ram / 1024} GB`,
      },
      {
        label: t('VCPUs'),
        content: privateFlavors.vcpus,
      },
      // {
      //   label: t('Disk'),
      //   content: `${privateFlavors.disk} GB`,
      // },
    ];
    return {
      title: t('Flavor Info'),
      options,
    };
  }

  get imageCard() {
    const item = this.detailData.itemInList || {};
    const { image, image_name } = item;
    const url = `${this.getUrl('/compute/image')}/detail/${image}`;
    const options = [
      {
        label: t('Name'),
        content: image_name || '-',
      },
      {
        label: t('ID'),
        content: image ? <Link to={url}>{image}</Link> : '-',
      },
    ];
    return {
      title: t('Image Info'),
      options,
    };
  }

  get securityGroupCard() {
    const { security_groups = [] } = this.detailData;
    const items = Array.from(new Set(security_groups.map((it) => it.name)));
    const {
      match: { url },
    } = this.props;
    const options = [
      {
        label: t('Name'),
        dataIndex: 'security_groups',
        render: () =>
          (items || []).map((it) => (
            <div key={it}>
              <Link to={`${url}?tab=securityGroup`} key={it}>
                {it}
              </Link>
            </div>
          )),
      },
    ];
    return {
      title: t('Security Group Info'),
      options,
    };
  }

  get serverGroupCard() {
    const server_group = this.serverGroupStore.detail || {};
    const { name } = server_group;
    const options = [
      {
        label: t('Name'),
        content: name || '-',
      },
    ];
    return {
      title: t('Server Group'),
      options,
    };
  }

  get interfaces() {
    const infos = [];
    const {
      match: { url },
    } = this.props;
    (this.interfaceStore.list.data || []).forEach((item) => {
      const { name, id, networkName, fixed_ips = [], network_id } = item;
      infos.push({
        networkName,
        name: <Link to={`${url}?tab=interface`}>{name || id}</Link>,
        address: fixed_ips.map((it) => it.ip_address),
        network_id,
        interface: item,
      });
    });
    return infos;
  }

  fetchVolumes = async () => {
    const params = {
      serverId: this.id,
    };
    if (!this.isMyResource) {
      params.all_projects = true;
    }
    await this.volumeStore.fetchList(params);
  };

  fetchInterfaces = async () => {
    const params = {
      device_id: this.id,
    };
    if (!this.isMyResource) {
      params.all_projects = true;
    }
    await this.interfaceStore.fetchList(params);
    this.store.isLoading = false;
  };

  fetchSeverGroup = async () => {
    const { server_groups = [] } = this.detailData;
    await this.serverGroupStore.fetchDetail({ id: server_groups[0] });
  };

  handleRefreshVolume = () => {
    this.fetchVolumes();
  };

  renderInterfaceRow() {
    const interfaceItem = this.interfaces.map((info, index) => (
      <div className={styles['vm-interface']} key={`vm-interface-${index}`}>
        <div className={styles['interface-line']} />
        <div className={styles['interface-item']}>
          <div style={{ marginBottom: 8 }}>
            {info.networkName} ( {info.name} ){' '}
          </div>
          <div>
            <img
              alt="interface_icon"
              src={interfaceIcon}
              style={{ height: 28, paddingLeft: 6, marginRight: 10 }}
            />
            <div style={{ display: 'inline-table' }}>
              {info.address.map((it) => (
                <div key={`${it}-${index}`}>{it}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ));
    return <Row>{interfaceItem}</Row>;
  }

  renderVmRow() {
    const item = toJS(this.detailData.itemInList) || {};
    const { status } = this.detailData;
    const { image_name, image_os_distro } = item;
    return (
      <Row className={classnames(styles.vm)}>
        <div className={styles['vm-icon']}>
          <img alt="instance_icon" src={instanceIcon} style={{ height: 36 }} />
        </div>
        <div className={styles['vm-info']}>
          <div className={styles['info-item']}>
            <ImageType
              className={styles['info-item-icon']}
              type={image_os_distro}
              title={image_os_distro}
            />
            <span>{image_name}</span>
          </div>
          <div className={styles['info-item']}>
            <Status status={status} text={instanceStatus[status]} />
          </div>
        </div>
      </Row>
    );
  }

  renderVolumeRow() {
    const {
      match: { url },
    } = this.props;
    const attachedVoluems = (this.volumeStore.list.data || []).map((item) => {
      const volumeInfos = [
        {
          label: item.disk_tag === 'os_disk' ? t('Root Disk') : t('Data Disk'),
          value: item.name || '-',
        },
        {
          label: t('ID'),
          value: <Link to={`${url}?tab=volumes`}>{item.id}</Link>,
        },
        {
          label: t('Size'),
          value: `${item.size}GB`,
        },
        {
          label: t('Volume Type'),
          value: item.volume_type || '-',
        },
        {
          label: t('Create Time'),
          value: getSinceTime(item.created_at) || '-',
        },
      ];
      const volumeInfoItem = volumeInfos.map((info) => (
        <Row
          className={styles['volume-info-item']}
          key={`volume-info-item-${generateId()}`}
        >
          <Col span={3} className={styles['info-key']}>
            {info.label}
          </Col>
          <Col>{info.value}</Col>
        </Row>
      ));
      return (
        <div
          className={styles['attached-volume']}
          key={`attached-volume-${generateId()}`}
        >
          <div className={styles['attached-volume-line']} />
          <div className={styles['attached-volume-content']}>
            <div className={styles['volume-icon']}>
              <img alt="volume_icon" src={volumeIcon} style={{ height: 36 }} />
            </div>
            <div className={styles['volume-info']}>{volumeInfoItem}</div>
          </div>
        </div>
      );
    });
    const { isAdminPage } = this.props;
    const containerProps = { isAdminPage };
    return (
      <Row className={styles['vm-volume']}>
        <div className={styles['volume-inline']} />
        <div className={styles['volume-content']}>
          {attachedVoluems}
          <div>
            <div className={styles['attach-action-line']} />
            {/* <a onClick={this.info}>{t('Attach volume')}</a> */}
            <ItemActionButtons
              actions={{ firstAction: AttachVolume }}
              onFinishAction={this.handleRefreshVolume}
              item={this.detailData}
              containerProps={containerProps}
              firstActionClassName={styles['attach-btn']}
            />
          </div>
        </div>
      </Row>
    );
  }

  renderTopoContent() {
    return (
      <div className={styles['topology-content']}>
        {this.renderVmRow()}
        {this.renderInterfaceRow()}
        {this.renderVolumeRow()}
      </div>
    );
  }

  get topoCard() {
    const title = t('Instance Architecture');
    const titleHelp = (
      <div>
        <p>
          {t(
            'The instance architecture diagram mainly shows the overall architecture composition of the instance. If you need to view the network topology of the instance, please go to: '
          )}
        </p>
        <Link to="/network/topo">{t('Network topology page')}</Link>
      </div>
    );
    const options = [
      {
        content: this.renderTopoContent(),
      },
    ];
    const { refreshDetail } = this.props;
    const button = (
      <Button
        size="small"
        type="default"
        shape="circle"
        style={{ marginLeft: 16 }}
        onClick={() => refreshDetail()}
        icon={<SyncOutlined />}
      />
    );

    return {
      labelCol: 0,
      title,
      titleHelp,
      options,
      button,
    };
  }
}