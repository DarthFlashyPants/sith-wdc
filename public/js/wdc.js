var sithConnector = tableau.makeConnector();
var sithData = {};

sithConnector.getColumnHeaders = function () {
    var fieldNames = ['X', 'Y', 'From', 'To', 'Midichlorians', 'Darkness', 'pathOrder']
    var fieldTypes = ['float', 'float', 'string', 'string', 'int', 'int', 'int'];
    tableau.headersCallback(fieldNames, fieldTypes); // tell tableau about the fields and their types
};

sithConnector.getTableData = function (lastRecordToken) {
    sithData = JSON.parse(tableau.connectionData);
    var toRet = [];
    for (i = 0; i < sithData.darkness.length; i++) {
        var entry = {
            'X': sithData.x[i],
            'Y': sithData.y[i],
            'From': sithData.from[i],
            'To': sithData.to[i],
            'Midichlorians': sithData.midichlorians[i],
            'Darkness': sithData.darkness[i],
            'pathOrder': sithData.pathOrder[i]
        };
        toRet.push(entry);
    }
    /*    toRet.push({'X':99.3,
                                'Y':100.1,
                                'From': 'Sith',
                                'To': 'Rule',
                                'Midichlorians': 1000,
                                'Darkness':10,
                                'pathOrder':1});

               */
    tableau.dataCallback(toRet, toRet.length.toString(), false);
};

tableau.registerConnector(sithConnector);

function submitQuery() {
    console.log("submitQuery()");
    // plug in the RETURN clause, which'll be the same every time...
    var returnClause = " RETURN child.personID as id, child.name as name, child.parent1 as parent1, child.parent2 as parent2, child.midichlorians as midichlorians, child.darkness as darkness";
    var match = $('textarea#query').val().toString();
    var jsonObj = {};
    jsonObj["statement"] = match + returnClause;
    query = JSON.stringify(jsonObj)
    console.log(query);
    console.log("About to POST");

    $.ajax({
        url: '/wdc/query',
        type: 'post',
        data: query,
        contentType: 'application/json ;charset=UTF-8',
        dataType: 'json',
        success: function (data) {
            console.log("success");
            console.log("response:", data);

            dataString = JSON.stringify(data);
            tableau.connectionData = dataString;
            tableau.submit();


        }
    });


}
