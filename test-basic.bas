REM Simple QBasic test program
CLS
PRINT "NebulaBasic Test Program"
PRINT "========================"

REM Count to 5
FOR x = 1 TO 5
    PRINT "Count: "; x
NEXT x

REM Test IF statement
y = 10
IF y > 5 THEN
    PRINT "Y is greater than 5"
ELSE
    PRINT "Y is not greater than 5"
END IF

PRINT "Program completed!"