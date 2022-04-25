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
import Base from 'containers/TabDetail';
import globalInstancesStore from 'stores/trove/instances';
import BaseDetail from './BaseDetail';
import Users from './Users';
import Databases from './Databases';
import Backups from './Backups';
import Logs from './Logs';
import Defaults from './Defaults';

@inject('rootStore')
@observer
export default class InstancesDetail extends Base {
  init() {
    this.store = globalInstancesStore;
  }

  get name() {
    return t('Backup Detail');
  }

  get policy() {
    return 'trove:instance:detail';
  }

  get listUrl() {
    return this.getRoutePath('databaseInstances');
  }

  get detailInfos() {
    return [
      {
        title: t('ID'),
        dataIndex: 'id',
      },
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
      },
      {
        title: t('Tenant Id'),
        dataIndex: 'tenant_id',
      },
    ];
  }

  get tabs() {
    return [
      {
        title: t('General Info'),
        key: 'general_info',
        component: BaseDetail,
      },
      {
        title: t('Users'),
        key: 'users',
        component: Users,
      },
      {
        title: t('Databases'),
        key: 'databases',
        component: Databases,
      },
      {
        title: t('Backups'),
        key: 'backups',
        component: Backups,
      },
      {
        title: t('Logs'),
        key: 'logs',
        component: Logs,
      },
      {
        title: t('Defaults'),
        key: 'defaults',
        component: Defaults,
      },
    ];
  }
}
