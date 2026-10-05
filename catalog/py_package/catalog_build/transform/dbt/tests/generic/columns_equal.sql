{% test columns_equal(model, column_name, other_column) %}

select {{ column_name }}, {{ other_column }}
from {{ model }}
where {{ column_name }} is distinct from {{ other_column }}

{% endtest %}
