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

import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalVirtualAdapterStore from 'stores/neutron/virtual-adapter';
import { SecurityGroupStore } from 'stores/neutron/security-group';
import {
  securityGroupColumns,
  securityGroupFilter,
} from 'resources/security-group';
import { toJS } from 'mobx';

@inject('rootStore')
@observer
export default class ManageSecurityGroup extends ModalAction {
  static id = 'manage-security-group';

  static title = t('Manage Security Group');

  get name() {
    return t('Manage Security Group');
  }

  static policy = 'update_port:port_security_enabled';

  static allowed = () => Promise.resolve(true);

  init() {
    this.securityGroupStore = new SecurityGroupStore();
    this.currentSecurityGroups = [];
    this.state.sgInitValue = {
      selectedRowKeys: [],
      selectedRows: [],
    };
    this.detail = null;
    this.getPortDetail();
  }

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  get defaultValue() {
    const { sgInitValue } = this.state;
    const { selectedRowKeys = [] } = sgInitValue || {};
    if (selectedRowKeys.length) {
      return {
        securityGroup: sgInitValue,
      };
    }
    return {};
  }

  async getPortDetail() {
    const { id, security_groups } = this.item;
    let sgs = security_groups;
    if (!security_groups) {
      const detail = await globalVirtualAdapterStore.fetchDetail({ id });
      sgs = detail.security_groups;
    }
    const results = await Promise.all(
      sgs.map((it) => this.securityGroupStore.fetchDetail({ id: it }))
    );
    const sgInitValue = {
      selectedRowKeys: sgs.map((it) => toJS(it)),
      selectedRows: results.map((it) => toJS(it)),
    };
    this.setState({
      sgInitValue,
    });
    this.updateFormValue('securityGroup', sgInitValue);
  }

  onSubmit = (values) => {
    const { securityGroup: { selectedRowKeys: security_groups = [] } = {} } =
      values;
    const { id } = this.item;
    const reqBody = { port: { security_groups } };
    return this.securityGroupStore.updatePortSecurityGroup({ id, reqBody });
  };

  get messageHasItemName() {
    const { item } = this.props;
    return !!item && item.name;
  }

  get formItems() {
    const { sgInitValue } = this.state;
    return [
      {
        name: 'securityGroup',
        label: t('Security Group'),
        type: 'select-table',
        tips: t(
          'The security group is similar to the firewall function for setting up network access control, or you can go to the console and create a new security group. (Note: The security group you selected will work on all virtual LANS on the instances.)'
        ),
        backendPageStore: this.securityGroupStore,
        extraParams: { project_id: this.currentProjectId },
        initValue: sgInitValue,
        required: true,
        isMulti: true,
        filterParams: securityGroupFilter,
        columns: securityGroupColumns,
        onRow: () => {},
      },
    ];
  }
}