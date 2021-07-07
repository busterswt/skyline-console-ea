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

import React, { Component } from 'react';
import { Row, Col, Card, Descriptions, Progress, Avatar } from 'antd';
import { inject, observer } from 'mobx-react';
import globalHypervisorStore from 'stores/nova/hypervisor';
import styles from '../style.less';

const resourceCircle = [
  {
    resource: 'vcpus',
    used: 'vcpus_used',
    label: t('CPU usage Num (Core)'),
  },
  {
    resource: 'memory_mb',
    used: 'memory_mb_used',
    label: t('Memory usage Num (GB'),
  },
];

export const color = {
  infoColor: 'rgba(0, 104, 255, 0.65)',
  warnColor: '#FE9901',
  dangerColor: '#D93126',
};
@inject('rootStore')
@observer
class ResourceCircle extends Component {
  constructor(props) {
    super(props);
    this.store = globalHypervisorStore;
  }

  componentDidMount() {
    this.store.getOverview();
  }

  renderCircle = (item, index) => {
    const { overview } = this.store;
    const resource = overview[item.resource];

    const used = overview[item.used];
    const percentNum = parseFloat(((used / resource) * 100).toFixed(2));
    const unUsed = parseFloat((resource - used).toFixed(2));
    let circleColor = color.infoColor;
    if (percentNum > 70) {
      circleColor = color.warnColor;
    }
    if (percentNum > 90) {
      circleColor = color.dangerColor;
    }
    return (
      <Col
        span={12}
        style={{ textAlign: 'center' }}
        key={`${resource}-${index}`}
      >
        <span className={styles.resource}>{item.label}</span>
        <Progress
          type="circle"
          width={150}
          percent={percentNum}
          strokeColor={circleColor}
          format={(percent) => `${percent}%`}
        />
        <Row className={styles.num}>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Avatar
              shape="square"
              size={15}
              style={{
                marginBottom: 2,
                marginRight: 2,
                backgroundColor: circleColor,
              }}
            />
            {`${t('Used Resource')}: ${used}`}
          </Col>
          <Col span={12} style={{ textAlign: 'left', paddingLeft: 20 }}>
            <Avatar
              shape="square"
              size={15}
              style={{
                marginBottom: 2,
                marginRight: 2,
                backgroundColor: '##A3A3A3',
              }}
            />
            {`${t('Unused')}: ${unUsed > 0 ? unUsed : '0'}`}
          </Col>
        </Row>
      </Col>
    );
  };

  render() {
    const { isLoading } = this.store;
    return (
      <Card
        loading={isLoading}
        className={styles.chart}
        title={t('Virtual Resource Num')}
        bordered={false}
      >
        <Descriptions column={1}>
          <div className="site-card-wrapper">
            <Row gutter={16}>
              {resourceCircle.map((item, index) => {
                return this.renderCircle(item, index);
              })}
            </Row>
          </div>
        </Descriptions>
      </Card>
    );
  }
}

export default ResourceCircle;