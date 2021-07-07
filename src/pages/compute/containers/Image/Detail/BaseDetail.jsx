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
import { ImageStore } from 'stores/glance/image';
import { imageProperties, imageVisibility, imageOS } from 'resources/image';
import Base from 'containers/BaseDetail';
import { isObject, isArray } from 'lodash';
import { Link } from 'react-router-dom';

@inject('rootStore')
@observer
export default class BaseDetail extends Base {
  init() {
    this.store = new ImageStore();
  }

  get isImageDetail() {
    const { pathname } = this.props.location;
    return pathname.indexOf('image') >= 0;
  }

  get leftCards() {
    const cards = [this.baseInfoCard, this.securityCard];
    return this.isImageDetail ? cards : [this.InstanceCard, ...cards];
  }

  get rightCards() {
    return [this.propertiesCard];
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Size'),
        dataIndex: 'size',
        valueRender: 'bytes',
      },
      {
        label: t('Min System Disk(GB)'),
        dataIndex: 'min_disk',
      },
      {
        label: t('Min Memory(GB)'),
        dataIndex: 'min_ram',
        valueRender: 'GBValue',
      },
      {
        label: t('Disk Format'),
        dataIndex: 'disk_format',
        valueRender: 'uppercase',
      },
      {
        label: t('OS'),
        dataIndex: 'os_distro',
        render: (value) => imageOS[value] || '-',
      },
      {
        label: t('OS Version'),
        dataIndex: 'os_version',
      },
      {
        label: t('Container Format'),
        dataIndex: 'container_format',
        valueRender: 'uppercase',
      },
    ];
    return {
      title: t('Base Info'),
      options,
    };
  }

  get securityCard() {
    const options = [
      {
        label: t('Owner'),
        dataIndex: 'owner',
        copyable: true,
      },
      {
        label: t('Filename'),
        dataIndex: 'file',
        copyable: true,
      },
      {
        label: t('Visibility'),
        dataIndex: 'visibility',
        render: (value) => imageVisibility[value] || '-',
      },
      {
        label: t('Protected'),
        dataIndex: 'protected',
        valueRender: 'yesNo',
      },
      {
        label: t('Checksum'),
        dataIndex: 'checksum',
        copyable: true,
      },
    ];

    return {
      title: t('Security Info'),
      options,
    };
  }

  get InstanceCard() {
    const options = [
      {
        label: t('Instance'),
        dataIndex: 'instance',
        render: (value) => {
          if (!value) {
            return '-';
          }
          if (value.server_name) {
            return (
              <Link
                to={`${this.getUrl('/compute/instance')}/detail/${
                  value.server_id
                }?tab=snapshots`}
              >
                {value.server_name}
              </Link>
            );
          }
          return value.server_id;
        },
      },
    ];
    return {
      title: t('Instance Info'),
      options,
    };
  }

  getPropertyItem = (properties, key, copyableMap) => {
    const labelInfo = imageProperties[key] || key;
    const label = isObject(labelInfo) ? labelInfo.label : labelInfo;
    const filter = isObject(labelInfo) ? label.filters : null;
    const value = properties[key];
    const valueRender = filter || null;
    const render =
      filter || isObject(value) || isArray(value)
        ? (data) => JSON.stringify(data)
        : null;
    const copyable = copyableMap.includes(key);
    return {
      label,
      dataIndex: key,
      valueRender,
      render,
      copyable,
    };
  };

  get propertiesCard() {
    const copyableMap = ['locations', 'file', 'direct_url'];
    const noUseKeys = [
      'checksum',
      'created_at',
      'min_disk',
      'min_ram',
      'name',
      'updated_at',
      'status',
      'protected',
      'visibility',
      'owner',
      'disk_format',
      'container_format',
      'size',
      'id',
    ];
    const detailData = toJS(this.detailData) || {};
    const properties = detailData.originData || detailData;
    const keys = Object.keys(properties).filter(
      (key) => noUseKeys.indexOf(key) < 0
    );
    const options = keys.map((key) =>
      this.getPropertyItem(properties, key, copyableMap)
    );

    return {
      title: t('Custom Properties Info'),
      options,
    };
  }
}