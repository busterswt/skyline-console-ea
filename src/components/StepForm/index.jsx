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
import { cloneDeep, isEmpty } from 'lodash';
import Notify from 'components/Notify';
import { Button, Steps, Spin } from 'antd';
import classnames from 'classnames';
import { firstUpperCase, unescapeHtml } from 'utils/index';
import { parse } from 'qs';
import NotFound from 'components/Cards/NotFound';
import styles from './index.less';

export default class BaseStepForm extends React.Component {
  constructor(props, options = {}) {
    super(props);

    this.options = options;

    this.state = {
      // eslint-disable-next-line react/no-unused-state
      formTemplate: cloneDeep(this.formTemplate),
      current: 0,
      data: {},
    };

    this.values = {};
    this.setFormRefs();
    this.init();
  }

  componentDidMount() {}

  // componentWillReceiveProps(nextProps) {
  //   formPersist.set(
  //     `${nextProps.module}_step_form`,
  //     this.state.formTemplate
  //   );
  // }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe();
    this.disposer && this.disposer();
    this.unMountActions && this.unMountActions();
  }

  get hasConfirmStep() {
    return false;
  }

  get name() {
    return '';
  }

  get title() {
    return `${this.name}s`;
  }

  get className() {
    return '';
  }

  get prefix() {
    return this.props.match.url;
  }

  get routing() {
    return this.props.rootStore.routing;
  }

  get location() {
    return this.props.location || {};
  }

  get locationParams() {
    return parse(this.location.search.slice(1));
  }

  get match() {
    return this.props.match || {};
  }

  get listUrl() {
    return '/base/tmp';
  }

  get checkEndpoint() {
    return false;
  }

  get endpoint() {
    return '';
  }

  get endpointError() {
    return this.checkEndpoint && !this.endpoint;
  }

  get labelCol() {
    return {
      xs: { span: 4 },
      sm: { span: 2 },
    };
  }

  get wrapperCol() {
    return {
      xs: { span: 16 },
      sm: { span: 12 },
    };
  }

  get steps() {
    return [];
  }

  get formTemplate() {
    return {};
  }

  get okBtnText() {
    return t('Confirm');
  }

  get instanceName() {
    const { name } = this.values || {};
    return name;
  }

  get successText() {
    return firstUpperCase(
      t('{action} successfully, instance: {name}.', {
        action: this.name.toLowerCase(),
        name: this.instanceName,
      })
    );
  }

  get errorText() {
    return t('Unable to {action}, instance: {name}.', {
      action: this.name.toLowerCase(),
      name: this.instanceName,
    });
  }

  get isSubmitting() {
    return (this.store && this.store.isSubmitting) || false;
  }

  get isLoading() {
    if (this.hasExtraProps && isEmpty(this.state.extra)) {
      return true;
    }
    return false;
  }

  get currentComponent() {
    const { current } = this.state;
    return this.steps[current].component;
  }

  get currentRef() {
    const { current } = this.state;
    return this.formRefs[current];
  }

  get isAdminPage() {
    return this.props.isAdminPage || false;
  }

  get hasExtraProps() {
    return false;
  }

  setFormRefs() {
    this.formRefs = this.steps.map(() => React.createRef());
  }

  getUrl(path, adminStr) {
    return this.isAdminPage ? `${path}${adminStr || '-admin'}` : path;
  }

  getPrevBtn() {
    const { current } = this.state;
    if (current === 0) {
      return null;
    }
    const preTitle = this.steps[current - 1].title;
    return (
      <Button style={{ margin: '0 8px' }} onClick={() => this.prev()}>
        {`${t('Previous')}: ${preTitle}`}
      </Button>
    );
  }

  // eslint-disable-next-line no-unused-vars
  onSubmit = (values) => Promise.resolve();

  onOk = () => {
    const { data } = this.state;
    // eslint-disable-next-line no-console
    console.log('onOk', data);
    this.values = data;
    this.onSubmit(data).then(
      () => {
        this.routing.push(this.listUrl);
        Notify.success(this.successText);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.log('reject', err);
        Notify.errorWithDetail(this.errorText, err);
      }
    );
  };

  onCancel = () => {};

  onClickSubmit = () => {
    if (!this.hasConfirmStep) {
      this.currentRef.current.wrappedInstance.checkFormInput((values) => {
        this.updateData(values, this.onOk);
      });
      return;
    }
    this.onOk();
  };

  onClickCancel = () => {
    this.routing.push(this.listUrl);
  };

  getNextBtn() {
    const { current } = this.state;
    if (current >= this.steps.length - 1) {
      return null;
    }
    const { title } = this.steps[current + 1];
    return (
      <Button type="primary" onClick={() => this.next()}>
        {`${t('Next')}: ${title}`}
      </Button>
    );
  }

  updateDataOnPrev = (values) => {
    this.updateData(values, () => {
      // const current = this.state.current - 1;
      this.setState((pre) => ({ current: pre.current - 1 }));
    });
  };

  updateData = (values, callback) => {
    const { data } = this.state;
    this.setState(
      {
        data: {
          ...data,
          ...values,
        },
      },
      () => {
        callback && callback();
      }
    );
  };

  unescape = (message) => unescapeHtml(message);

  goStep = (index) => {
    this.setState({
      current: index,
    });
  };

  prev() {
    this.currentRef.current.wrappedInstance.checkFormInput(
      this.updateDataOnPrev,
      this.updateDataOnPrev
    );
  }

  next() {
    this.currentRef.current.wrappedInstance.checkFormInput((values) => {
      // const current = this.state.current + 1;
      this.updateData(values);
      // this.setState({ current });
      this.setState((prev) => ({ current: prev.current + 1 }));
    });
  }

  init() {
    this.store = {};
  }

  renderFooterLeft() {
    return null;
  }

  renderFooter() {
    const { current } = this.state;
    return (
      <div className={styles.footer}>
        <div
          className={classnames(styles['footer-left'], 'step-form-footer-left')}
        >
          {this.renderFooterLeft()}
        </div>
        <div className={classnames(styles.btns, 'step-form-footer-btns')}>
          <Button className={styles.cancel} onClick={this.onClickCancel}>
            {t('Cancel')}
          </Button>
          {this.getPrevBtn()}
          {this.getNextBtn()}
          {current === this.steps.length - 1 && (
            <Button type="primary" onClick={this.onClickSubmit}>
              {t('Confirm')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  renderForms() {
    const Component = this.currentComponent;
    const { data, extra } = this.state;
    if (this.hasExtraProps && isEmpty(extra)) {
      return null;
    }
    return (
      <Component
        ref={this.currentRef}
        context={data}
        extra={extra}
        updateContext={this.updateData}
        goStep={this.goStep}
        isAdminPage={this.isAdminPage}
        match={this.match}
        location={this.location}
      />
    );
  }

  renderSteps() {
    const { current } = this.state;
    const { Step } = Steps;
    return (
      <div>
        <div className={styles.step}>
          <Steps current={current}>
            {this.steps.map((item) => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>
        </div>

        <div className={styles.form}>
          {/* {this.steps[current].content} */}
          {this.renderForms()}
        </div>
      </div>
    );
  }

  render() {
    if (this.endpointError) {
      return (
        <NotFound
          title={this.name}
          link={this.listUrl}
          endpointError
          goList
          isAction
        />
      );
    }
    return (
      <div className={classnames(styles.wrapper, this.className)}>
        <Spin spinning={this.isLoading || this.isSubmitting}>
          {this.renderSteps()}
          {this.renderFooter()}
        </Spin>
      </div>
    );
  }
}
