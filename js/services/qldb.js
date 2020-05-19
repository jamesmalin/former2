/* ========================================================================== */
// QLDB
/* ========================================================================== */

sections.push({
    'category': 'Database',
    'service': 'QLDB',
    'resourcetypes': {
        'Ledgers': {
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
                        title: 'ID',
                        field: 'id',
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
                        field: 'name',
                        title: 'Name',
                        sortable: true,
                        editable: true,
                        footerFormatter: textFormatter,
                        align: 'center'
                    },
                    {
                        field: 'creationdate',
                        title: 'Creation Date',
                        sortable: true,
                        editable: true,
                        formatter: timeAgoFormatter,
                        footerFormatter: textFormatter,
                        align: 'center'
                    }
                ]
            ]
        }
    }
});

async function updateDatatableDatabaseQLDB() {
    blockUI('#section-database-qldb-ledgers-datatable');

    await sdkcall("QLDB", "listLedgers", {
        // no params
    }, false).then(async (data) => {
        $('#section-database-qldb-ledgers-datatable').deferredBootstrapTable('removeAll');

        await Promise.all(data.Ledgers.map(async (ledger) => {
            return sdkcall("QLDB", "describeLedger", {
                Name: ledger.Name
            }, false).then(async (data) => {
                $('#section-database-qldb-ledgers-datatable').deferredBootstrapTable('append', [{
                    f2id: data.Arn,
                    f2type: 'qldb.ledger',
                    f2data: data,
                    f2region: region,
                    name: data.Name,
                    creationdate: data.CreationDateTime
                }]);
            });
        }));

    }).catch(() => { });

    unblockUI('#section-database-qldb-ledgers-datatable');
}

service_mapping_functions.push(function(reqParams, obj, tracked_resources){
    if (obj.type == "qldb.ledger") {
        reqParams.cfn['Name'] = obj.data.Name;
        reqParams.cfn['DeletionProtection'] = obj.data.DeletionProtection;
        reqParams.cfn['PermissionsMode'] = 'ALLOW_ALL';

        /*
        TODO:
        DeletionProtection: Boolean
        Name: String
        PermissionsMode: String
        Tags: 
            - Tag
        */

        tracked_resources.push({
            'obj': obj,
            'logicalId': getResourceName('qldb', obj.id, 'AWS::QLDB::Ledger'),
            'region': obj.region,
            'service': 'qldb',
            'type': 'AWS::QLDB::Ledger',
            'options': reqParams
        });
    } else {
        return false;
    }

    return true;
});
