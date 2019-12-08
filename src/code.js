var CC = DataStudioApp.createCommunityConnector();

// https://developers.google.com/datastudio/connector/reference#getauthtype
function getAuthType(request) { // eslint-disable-line no-unused-vars
  return CC.newAuthTypeResponse()
    .setAuthType(CC.AuthType.NONE)
    .build();
}

// https://developers.google.com/datastudio/connector/reference#getconfig
function getConfig(request) { // eslint-disable-line no-unused-vars
  var config = CC.getConfig();

  config.newInfo()
    .setId('info')
    .setText('This connector does not require any configuration. Click CONNECT at the top right to get started.');

  config.setDateRangeRequired(true);

  return config.build();
}

// https://developers.google.com/datastudio/connector/reference#getschema
function getSchema(request) { // eslint-disable-line no-unused-vars
  var fields = getFields().build();
  return {
    schema: fields
  };
}

function getFields(request) { // eslint-disable-line no-unused-vars
  var fields = CC.getFields();
  var fieldTypes = CC.FieldType;
  var aggregationTypes = CC.AggregationType;

  fields.newMetric()
    .setId('id')
    .setName('ID')
    .setType(fieldTypes.NUMBER)
    .setAggregation(aggregationTypes.COUNT_DISTINCT);

  fields.newDimension()
    .setId('status')
    .setName('Status')
    .setType(fieldTypes.TEXT);

  fields.newDimension()
    .setId('resolution')
    .setName('Resolution')
    .setType(fieldTypes.TEXT);

  fields.newDimension()
    .setId('project')
    .setName('Project')
    .setType(fieldTypes.TEXT);

  fields.newDimension()
    .setId('category')
    .setName('Category')
    .setType(fieldTypes.TEXT);

  fields.newDimension()
    .setId('version')
    .setName('Version')
    .setType(fieldTypes.TEXT);

  fields.newDimension()
    .setId('priority')
    .setName('Priority')
    .setType(fieldTypes.TEXT);

  fields.newDimension()
    .setId('severity')
    .setName('Severity')
    .setType(fieldTypes.TEXT);

  fields.newDimension()
    .setId('created_at')
    .setName('Created at')
    .setType(fieldTypes.YEAR_MONTH_DAY);

  fields.newDimension()
    .setId('updated_at')
    .setName('Updated at')
    .setType(fieldTypes.YEAR_MONTH_DAY);

  return fields;
}

// https://developers.google.com/datastudio/connector/reference#getdata
function getData(request) { // eslint-disable-line no-unused-vars
  var requestedFields = getFields().forIds(
    request.fields.map(function (field) {
      return field.name;
    })
  );
  try {
    var apiResponse = fetchDataFromApi(request);
    var data = getFormattedData(apiResponse, requestedFields);
  } catch (e) {
    console.error(JSON.stringify(e, null , '\t'));
    CC.newUserError()
      .setDebugText('Error fetching data from API. Exception details: ' + e)
      .setText(
        'The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists.'
      )
      .throwException();
  }

  return {
    schema: requestedFields.build(),
    rows: data
  };
}

function fetchDataFromApi(request) { // eslint-disable-line no-unused-vars
  var app = MantisClient.create(PropertiesService.getUserProperties().getProperty('MANTIS_TOKEN'));
  // 直近500件のissueを取得する
  var issues = app.getIssues(null, null, 100, 1);

  return issues;
}

function getFormattedData(response, requestedFields) {
  return response.map(function (issue) {
    var values = [];
    requestedFields.asArray().forEach(function (field) {
      switch (field.getId()) {
      case 'id':
        values.push(issue.id);
        break;
      case 'status':
        values.push(issue.status.label);
        break;
      case 'resolution':
        values.push(issue.resolution.label);
        break;
      case 'project':
        values.push(issue.project.name);
        break;
      case 'category':
        values.push(issue.category.name);
        break;
      case 'version':
        values.push(issue.version.name);
        break;
      case 'priority':
        values.push(issue.priority.label);
        break;
      case 'severity':
        values.push(issue.severity.label);
        break;
      case 'created_at':
        values.push(Utilities.formatDate(new Date(issue.created_at), 'JST', 'yyyy/MM/dd'));
        break;
      case 'updated_at':
        values.push(Utilities.formatDate(new Date(issue.updated_at), 'JST', 'yyyy/MM/dd'));
        break;
      default:
        values.push('');
      }
    });
    return{ values: values };
  });
}
