/* ========================================================================== */
// Device Farm
/* ========================================================================== */

sections.push({
    'category': 'Mobile',
    'service': 'Device Farm',
    'resourcetypes': {
        'Projects': {
            'terraformonly': true,
            'columns': [
                [
                    {
                        field: 'state',
                        checkbox: true,
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle'
                    },
                    {
                        title: 'Name',
                        field: 'name',
                        rowspan: 2,
                        align: 'center',
                        valign: 'middle',
                        sortable: true,
                        formatter: primaryFieldFormatter,
                        footerFormatter: textFormatter
                    },
                    {
                        title: 'Properties',
                        colspan: 4,
                        align: 'center'
                    }
                ],
                [
                    {
                        field: 'creationtime',
                        title: 'Creation Time',
                        sortable: true,
                        editable: true,
                        formatter: dateFormatter,
                        footerFormatter: textFormatter,
                        align: 'center'
                    }
                ]
            ]
        }
    }
});

async function updateDatatableMobileDeviceFarm() {
    blockUI('#section-mobile-devicefarm-projects-datatable');

    await sdkcall("DeviceFarm", "listProjects", {
        // no params
    }, false).then(async (data) => {
        $('#section-mobile-devicefarm-projects-datatable').deferredBootstrapTable('removeAll');

        await Promise.all(data.projects.map(project => {
            return sdkcall("DeviceFarm", "getProject", {
                arn: project.arn
            }, false).then((data) => {
                $('#section-mobile-devicefarm-projects-datatable').deferredBootstrapTable('append', [{
                    f2id: data.project.arn,
                    f2type: 'devicefarm.project',
                    f2data: data.project,
                    f2region: region,
                    name: data.project.name,
                    creationtime: data.created
                }]);
            });
        }));
    }).catch(() => { });

    unblockUI('#section-mobile-devicefarm-projects-datatable');
}

service_mapping_functions.push(function(reqParams, obj, tracked_resources){
    if (obj.type == "devicefarm.project") {
        reqParams.tf['name'] = obj.data.name;

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('devicefarm', obj.id, 'AWS::DeviceFarm::Project'), // not real resource type
            'region': obj.region,
            'service': 'devicefarm',
            'terraformType': 'aws_devicefarm_project',
            'options': reqParams
        });
    } else {
        return false;
    }

    return true;
});
